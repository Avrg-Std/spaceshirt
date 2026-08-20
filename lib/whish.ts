import "server-only";
import { WhishClient } from "whish-pay";

let client: WhishClient | null = null;

export function isWhishConfigured(): boolean {
  return Boolean(
    process.env.WHISH_CHANNEL?.trim() &&
      process.env.WHISH_SECRET?.trim() &&
      process.env.WEBSITE_URL?.trim()
  );
}

export function getWhishClient(): WhishClient {
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
