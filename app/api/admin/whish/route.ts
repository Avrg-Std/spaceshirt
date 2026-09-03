import { NextResponse } from "next/server";
import { setAppWhishEnvironment, type AppWhishEnvironment } from "@/lib/airtable";
import { withAdminAuth } from "@/lib/admin-api";
import {
  envWhishMode,
  getWebsiteUrl,
  getWhishClient,
  isWhishConfigured,
  isWhishMockMode,
  resolveWhishEnvironment,
  WHISH_API_URLS,
} from "@/lib/whish";

export async function GET() {
  return withAdminAuth(async () => {
    const mock = isWhishMockMode();
    const configured = isWhishConfigured();
    const environment = mock ? "sandbox" : await resolveWhishEnvironment();
    const websiteUrl = process.env.WEBSITE_URL?.trim()
      ? getWebsiteUrl()
      : null;

    let balance: number | null = null;
    let balanceError: string | null = null;

    if (configured && !mock) {
      try {
        const whish = await getWhishClient();
        balance = await whish.getBalance("USD");
      } catch (error) {
        balanceError =
          error instanceof Error ? error.message : "Failed to load Whish balance";
      }
    }

    return NextResponse.json({
      configured,
      mock,
      channelConfigured: Boolean(process.env.WHISH_CHANNEL?.trim()),
      websiteUrl,
      environment,
      envDefault: envWhishMode(),
      baseUrl: WHISH_API_URLS[environment],
      balance,
      balanceError,
      sandboxHints: {
        phone: "96170123456",
        otp: "111111",
      },
    });
  });
}

export async function PATCH(request: Request) {
  return withAdminAuth(async () => {
    const body = (await request.json()) as { environment?: string };
    const environment = body.environment?.trim().toLowerCase();

    if (environment !== "sandbox" && environment !== "production") {
      return NextResponse.json(
        { error: "environment must be sandbox or production" },
        { status: 400 }
      );
    }

    const saved = await setAppWhishEnvironment(environment as AppWhishEnvironment);
    const whish = isWhishConfigured() && !isWhishMockMode()
      ? await getWhishClient()
      : null;

    return NextResponse.json({
      environment: saved,
      baseUrl: WHISH_API_URLS[saved],
      clientEnvironment: whish?.environment ?? saved,
    });
  });
}
