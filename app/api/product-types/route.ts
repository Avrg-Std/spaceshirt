import { NextResponse } from "next/server";
import {
  getProductTypes,
  normalizeProductTypeGender,
} from "@/lib/airtable";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gender = normalizeProductTypeGender(
      searchParams.get("gender")?.trim() ?? ""
    );

    const types = await getProductTypes({
      gender,
      activeOnly: true,
      ensureDefaults: true,
    });

    return NextResponse.json({ types });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load product types";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
