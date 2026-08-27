import { NextResponse } from "next/server";
import { getFeaturedProducts } from "@/lib/airtable";

export async function GET() {
  try {
    const products = await getFeaturedProducts(4);
    return NextResponse.json({ products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load featured products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
