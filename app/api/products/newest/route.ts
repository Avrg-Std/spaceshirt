import { NextResponse } from "next/server";
import { getNewestProducts } from "@/lib/airtable";

export async function GET() {
  try {
    const products = await getNewestProducts(3);
    return NextResponse.json({ products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load newest products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
