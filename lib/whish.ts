import "server-only";
import { getAppWhishEnvironment } from "@/lib/airtable";

export const WHISH_API_URLS = {
  sandbox: "https://partner.api.sbx.whish.money/itel-service/api",
  production: "https://api.whish.money/itel-service/api",
} as const;

export type WhishLiveEnvironment = "sandbox" | "production";
export type WhishCurrency = "USD" | "LBP";
export type CollectStatus =
  | "pending"
  | "success"
  | "failed"
  | "refunded"
  | "unknown";

type WhishDialog = {
  title?: string;
  message?: string;
} | null;

type WhishApiEnvelope<T> = {
  status: boolean;
  code: string | null;
  dialog: WhishDialog;
  data: T;
  retrieved?: boolean;
};

export type PaymentResponse = {
  success: boolean;
  collectUrl?: string;
  code?: string | null;
  dialog?: WhishDialog;
};

export type StatusResponse = {
  collectStatus: CollectStatus;
  payerPhoneNumber?: string;
  amount?: number;
};

function requiredWhishEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getWebsiteUrl(): string {
  return requiredWhishEnv("WEBSITE_URL").replace(/\/$/, "");
}

function getUserAgent(): string {
  return (
    process.env.WHISH_USER_AGENT?.trim() ||
    "CiaoLu/1.0 (https://ciao-lu.com; hello@ciao-lu.com)"
  );
}

export function envWhishMode(): "mock" | WhishLiveEnvironment {
  const env = process.env.WHISH_ENVIRONMENT?.trim().toLowerCase();
  if (env === "mock" || env === "demo") return "mock";
  if (env === "production" || env === "live") return "production";
  return "sandbox";
}

export function isWhishMockMode(): boolean {
  return envWhishMode() === "mock";
}

export function isWhishConfigured(): boolean {
  if (isWhishMockMode()) {
    return Boolean(process.env.WEBSITE_URL?.trim());
  }

  return Boolean(
    process.env.WHISH_CHANNEL?.trim() &&
      process.env.WHISH_SECRET?.trim() &&
      process.env.WEBSITE_URL?.trim()
  );
}

export async function resolveWhishEnvironment(): Promise<WhishLiveEnvironment> {
  const stored = await getAppWhishEnvironment();
  if (stored) return stored;
  const env = envWhishMode();
  return env === "mock" ? "sandbox" : env;
}

function formatAmount(amount: number, currency: WhishCurrency): string {
  if (currency === "LBP") {
    return String(Math.max(1000, Math.round(amount)));
  }
  return Math.max(1, amount).toFixed(2);
}

export function validateAmount(
  receivedAmount: number,
  expectedAmount: number,
  currency: WhishCurrency,
  tolerance?: number
): boolean {
  const actualTolerance = tolerance ?? (currency === "LBP" ? 100 : 0.02);
  return Math.abs(receivedAmount - expectedAmount) <= actualTolerance;
}

export function generateExternalId(): string {
  return `${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
}

export function generateMockExternalId(): string {
  return generateExternalId();
}

export function parseCallbackUrl(url: string): {
  externalId: string | null;
  currency: WhishCurrency | null;
  errorCode?: string;
  errorMessage?: string;
} {
  const parsed = new URL(url);
  const externalId = parsed.searchParams.get("externalId");
  const currencyParam = parsed.searchParams.get("currency")?.toUpperCase();
  const currency =
    currencyParam === "USD" || currencyParam === "LBP" ? currencyParam : null;

  return {
    externalId: externalId?.trim() || null,
    currency,
    errorCode: parsed.searchParams.get("errorCode") ?? undefined,
    errorMessage: parsed.searchParams.get("errorMessage") ?? undefined,
  };
}

export class WhishClient {
  constructor(readonly environment: WhishLiveEnvironment) {}

  getBaseUrl(): string {
    return WHISH_API_URLS[this.environment];
  }

  generateExternalId(): string {
    return generateExternalId();
  }

  validateAmount(
    receivedAmount: number,
    expectedAmount: number,
    currency: WhishCurrency,
    tolerance?: number
  ): boolean {
    return validateAmount(receivedAmount, expectedAmount, currency, tolerance);
  }

  private headers(includeJson = false): Record<string, string> {
    const headers: Record<string, string> = {
      channel: requiredWhishEnv("WHISH_CHANNEL"),
      secret: requiredWhishEnv("WHISH_SECRET"),
      websiteUrl: getWebsiteUrl(),
      "User-Agent": getUserAgent(),
    };
    if (includeJson) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  }

  private async request<T>(
    path: string,
    init: RequestInit
  ): Promise<WhishApiEnvelope<T>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${this.getBaseUrl()}${path}`, {
        ...init,
        signal: controller.signal,
        cache: "no-store",
      });

      const body = (await response.json()) as WhishApiEnvelope<T>;

      if (body.status === false && body.code !== "500") {
        const message =
          body.dialog?.message ||
          body.code ||
          `Whish request failed (${response.status})`;
        throw new Error(message);
      }

      return body;
    } finally {
      clearTimeout(timeout);
    }
  }

  async createPayment(input: {
    amount: number;
    currency: WhishCurrency;
    invoice: string;
    externalId: string;
    successCallbackUrl: string;
    failureCallbackUrl: string;
    successRedirectUrl: string;
    failureRedirectUrl: string;
  }): Promise<PaymentResponse> {
    const envelope = await this.request<{ collectUrl?: string }>(
      "/payment/whish",
      {
        method: "POST",
        headers: this.headers(true),
        body: JSON.stringify({
          amount: formatAmount(input.amount, input.currency),
          currency: input.currency,
          invoice: input.invoice,
          externalId: String(input.externalId),
          successCallbackUrl: input.successCallbackUrl,
          failureCallbackUrl: input.failureCallbackUrl,
          successRedirectUrl: input.successRedirectUrl,
          failureRedirectUrl: input.failureRedirectUrl,
        }),
      }
    );

    return {
      success: envelope.status === true && Boolean(envelope.data?.collectUrl),
      collectUrl: envelope.data?.collectUrl,
      code: envelope.code,
      dialog: envelope.dialog,
    };
  }

  async getPaymentStatus(
    currency: WhishCurrency,
    externalId: string
  ): Promise<StatusResponse> {
    const envelope = await this.request<{
      collectStatus?: CollectStatus;
      payerPhoneNumber?: string;
      amount?: number;
    }>("/payment/collect/status", {
      method: "POST",
      headers: this.headers(true),
      body: JSON.stringify({
        currency,
        externalId: String(externalId),
      }),
    });

    return {
      collectStatus: envelope.data?.collectStatus ?? "unknown",
      payerPhoneNumber: envelope.data?.payerPhoneNumber,
      amount:
        typeof envelope.data?.amount === "number"
          ? envelope.data.amount
          : undefined,
    };
  }

  async getBalance(currency: WhishCurrency = "USD"): Promise<number> {
    const envelope = await this.request<{ balance?: number }>(
      `/payment/account/balance?currency=${encodeURIComponent(currency)}`,
      {
        method: "GET",
        headers: this.headers(),
      }
    );

    const balance = envelope.data?.balance;
    if (typeof balance !== "number") {
      throw new Error("Whish did not return a balance");
    }
    return balance;
  }

  async refund(input: {
    currency: WhishCurrency;
    externalId: string;
    refundReason?: string;
  }): Promise<{ retrieved: boolean }> {
    const envelope = await this.request<null>("/payment/whish/refund", {
      method: "POST",
      headers: this.headers(true),
      body: JSON.stringify({
        currency: input.currency,
        externalId: String(input.externalId),
        refundReason: input.refundReason,
      }),
    });

    return { retrieved: envelope.retrieved === true };
  }
}

export async function getWhishClient(): Promise<WhishClient> {
  if (isWhishMockMode()) {
    throw new Error(
      "Whish mock mode is enabled — real Whish client is not used."
    );
  }

  if (!isWhishConfigured()) {
    throw new Error(
      "Whish Pay is not configured. Set WHISH_CHANNEL, WHISH_SECRET, and WEBSITE_URL."
    );
  }

  const environment = await resolveWhishEnvironment();
  return new WhishClient(environment);
}
