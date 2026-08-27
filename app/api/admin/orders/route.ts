import { NextResponse } from "next/server";
import { getOrders } from "@/lib/airtable";
import { withAdminAuth } from "@/lib/admin-api";

export async function GET(request: Request) {
  return withAdminAuth(async () => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const orders = await getOrders(status ? { status } : undefined);
    return NextResponse.json({ orders });
  });
}
