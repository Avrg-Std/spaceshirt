import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/airtable";
import { withAdminAuth } from "@/lib/admin-api";
import { sendOrderConfirmationEmail } from "@/lib/email";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  return withAdminAuth(async () => {
    const { id } = await context.params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const result = await sendOrderConfirmationEmail(order);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, skipped: result.skipped === true },
        { status: result.skipped ? 503 : 500 }
      );
    }

    return NextResponse.json({ ok: true, emailId: result.id });
  });
}
