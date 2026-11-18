import { NextResponse } from "next/server";
import {
  getOrderNotifyEmails,
  normalizeOrderNotifyEmails,
  setOrderNotifyEmails,
} from "@/lib/airtable";
import { withAdminAuth } from "@/lib/admin-api";

export async function GET() {
  return withAdminAuth(async () => {
    const emails = await getOrderNotifyEmails();
    return NextResponse.json({ emails });
  });
}

export async function PUT(request: Request) {
  return withAdminAuth(async () => {
    const body = (await request.json()) as { emails?: unknown };
    const incoming = Array.isArray(body.emails)
      ? body.emails.filter((item): item is string => typeof item === "string")
      : typeof body.emails === "string"
        ? [body.emails]
        : [];

    const normalized = normalizeOrderNotifyEmails(incoming.join("\n"));
    const emails = await setOrderNotifyEmails(normalized);
    return NextResponse.json({ emails });
  });
}
