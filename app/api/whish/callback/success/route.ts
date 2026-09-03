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
      if (order.status !== "Confirmed") {
        await updateCustomerOrderStatusByWhishExternalId(parsed.externalId, "Confirmed");
      }
      return NextResponse.json({ ok: true, orderId: order.orderId, mock: true });
    }

    const whish = await getWhishClient();
    const status = await whish.getPaymentStatus(currency, parsed.externalId);

    if (status.collectStatus !== "success") {
      return NextResponse.json({ ok: false, reason: "Payment not successful" });
    }

    if (
      typeof status.amount === "number" &&
      !whish.validateAmount(status.amount, order.total, currency)
    ) {
      return NextResponse.json({ ok: false, reason: "Amount mismatch" }, { status: 400 });
    }

    if (order.status !== "Confirmed") {
      await updateCustomerOrderStatusByWhishExternalId(parsed.externalId, "Confirmed");
    }

    return NextResponse.json({ ok: true, orderId: order.orderId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Callback failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
