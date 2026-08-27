import { NextResponse } from "next/server";
import { getCustomerOrders, getCustomers } from "@/lib/airtable";
import { withAdminAuth } from "@/lib/admin-api";

type RouteContext = {
  params: Promise<{ email: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  return withAdminAuth(async () => {
    const { email } = await context.params;
    const decodedEmail = decodeURIComponent(email);
    const [customers, orders] = await Promise.all([
      getCustomers(),
      getCustomerOrders(decodedEmail),
    ]);

    const customer =
      customers.find(
        (entry) => entry.email.trim().toLowerCase() === decodedEmail.trim().toLowerCase()
      ) ?? null;

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ customer, orders });
  });
}
