import { NextResponse } from "next/server";
import { parseCallbackUrl } from "whish-pay";
import { updateCustomerOrderStatusByWhishExternalId } from "@/lib/airtable";
import { isWhishConfigured } from "@/lib/whish";

export async function GET(request: Request) {
  try {
    if (!isWhishConfigured()) {
      return NextResponse.json({ error: "Whish is not configured" }, { status: 503 });
    }

    const parsed = parseCallbackUrl(request.url);
    if (!parsed.externalId) {
      return NextResponse.json({ error: "Missing callback parameters" }, { status: 400 });
    }

    await updateCustomerOrderStatusByWhishExternalId(parsed.externalId, "Cancelled");

    return NextResponse.json({
      ok: true,
      cancelled: true,
      errorCode: parsed.errorCode,
      errorMessage: parsed.errorMessage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Callback failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
