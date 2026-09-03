import { NextResponse } from "next/server";
import {
  getCustomerOrderByWhishExternalId,
  updateCustomerOrderStatusByWhishExternalId,
} from "@/lib/airtable";
import {
  getWhishClient,
  isWhishConfigured,
  isWhishMockMode,
  parseCallbackUrl,
} from "@/lib/whish";

export async function GET(request: Request) {
  try {
    if (!isWhishConfigured()) {
      return NextResponse.json({ error: "Whish is not configured" }, { status: 503 });
    }

    const parsed = parseCallbackUrl(request.url);
    if (!parsed.externalId) {
      return NextResponse.json({ error: "Missing callback parameters" }, { status: 400 });
    }

    const currency = parsed.currency ?? "USD";
    const order = await getCustomerOrderByWhishExternalId(parsed.externalId);
    if (!order) {
      return NextResponse.json({ ok: false, reason: "Order not found" }, { status: 404 });
    }

    if (isWhishMockMode()) {
      return NextResponse.json({
        ok: true,
        attemptFailed: true,
        cancelled: false,
        orderId: order.orderId,
        mock: true,
      });
    }

    const whish = await getWhishClient();
    const status = await whish.getPaymentStatus(currency, parsed.externalId);

    // A failed attempt is not a settled failure — the link stays payable.
    if (status.collectStatus === "failed" && order.status !== "Cancelled") {
      await updateCustomerOrderStatusByWhishExternalId(parsed.externalId, "Cancelled");
      return NextResponse.json({
        ok: true,
        cancelled: true,
        collectStatus: status.collectStatus,
        orderId: order.orderId,
      });
    }

    return NextResponse.json({
      ok: true,
      cancelled: false,
      collectStatus: status.collectStatus,
      orderId: order.orderId,
      errorCode: parsed.errorCode,
      errorMessage: parsed.errorMessage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Callback failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
