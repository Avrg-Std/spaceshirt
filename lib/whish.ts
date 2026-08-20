import "server-only";
import { WhishClient } from "whish-pay";

let client: WhishClient | null = null;

export function isWhishMockMode(): boolean {
  const env = process.env.WHISH_ENVIRONMENT?.trim().toLowerCase();
  return env === "mock" || env === "demo";
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

export function getWhishClient(): WhishClient {
  if (isWhishMockMode()) {
    throw new Error("Whish mock mode is enabled — real Whish client is not used.");
  }

  if (!isWhishConfigured()) {
    throw new Error(
      "Whish Pay is not configured. Set WHISH_CHANNEL, WHISH_SECRET, and WEBSITE_URL."
    );
  }

  if (!client) {
    client = new WhishClient({
      channel: process.env.WHISH_CHANNEL!.trim(),
      secret: process.env.WHISH_SECRET!.trim(),
      websiteUrl: process.env.WEBSITE_URL!.trim().replace(/\/$/, ""),
      environment:
        process.env.WHISH_ENVIRONMENT === "production" ? "production" : "sandbox",
    });
  }

  return client;
}

export function getWebsiteUrl(): string {
  const url = process.env.WEBSITE_URL?.trim();
  if (!url) {
    throw new Error("Missing WEBSITE_URL");
  }
  return url.replace(/\/$/, "");
}

export function generateMockExternalId(): number {
  return Number(`${Date.now()}${Math.floor(Math.random() * 90 + 10)}`);
}
