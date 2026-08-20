import { NextResponse } from "next/server";
import { parseCallbackUrl } from "whish-pay";
import {
  getCustomerOrderByWhishExternalId,
  updateCustomerOrderStatusByWhishExternalId,
} from "@/lib/airtable";
import { getWhishClient, isWhishConfigured, isWhishMockMode } from "@/lib/whish";

export async function GET(request: Request) {
  try {
    if (!isWhishConfigured()) {
      return NextResponse.json({ error: "Whish is not configured" }, { status: 503 });
    }

    const parsed = parseCallbackUrl(request.url);
    if (!parsed.externalId || !parsed.currency) {
      return NextResponse.json({ error: "Missing callback parameters" }, { status: 400 });
    }

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

    const whish = getWhishClient();
    const status = await whish.getPaymentStatus(parsed.currency, parsed.externalId);

    if (status.collectStatus !== "success") {
      return NextResponse.json({ ok: false, reason: "Payment not successful" });
    }

    if (!whish.validateAmount(status.amount ?? 0, order.total, parsed.currency)) {
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
