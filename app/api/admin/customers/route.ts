import { NextResponse } from "next/server";
import { getCustomers } from "@/lib/airtable";
import { withAdminAuth } from "@/lib/admin-api";

export async function GET() {
  return withAdminAuth(async () => {
    const customers = await getCustomers();
    return NextResponse.json({ customers });
  });
}
