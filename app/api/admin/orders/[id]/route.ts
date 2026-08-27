import { NextResponse } from "next/server";
import { getOrderById, updateOrderStatus, type OrderStatus } from "@/lib/airtable";
import { withAdminAuth } from "@/lib/admin-api";

const VALID_STATUSES: OrderStatus[] = [
  "Pending",
  "Awaiting Payment",
  "Confirmed",
  "Shipped",
  "Cancelled",
];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  return withAdminAuth(async () => {
    const { id } = await context.params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ order });
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  return withAdminAuth(async () => {
    const { id } = await context.params;
    const body = (await request.json()) as { status?: string };

    if (!body.status || !VALID_STATUSES.includes(body.status as OrderStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const order = await updateOrderStatus(id, body.status as OrderStatus);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  });
}
