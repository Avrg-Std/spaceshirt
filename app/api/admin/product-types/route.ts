import { NextResponse } from "next/server";
import {
  createProductType,
  getProductTypes,
  normalizeProductTypeGender,
  PRODUCT_TYPE_GENDERS,
  type ProductTypeGender,
} from "@/lib/airtable";
import { withAdminAuth } from "@/lib/admin-api";

export async function GET(request: Request) {
  return withAdminAuth(async () => {
    const { searchParams } = new URL(request.url);
    const gender = normalizeProductTypeGender(
      searchParams.get("gender")?.trim() ?? ""
    );
    const activeOnly = searchParams.get("activeOnly") === "true";

    const types = await getProductTypes({
      gender,
      activeOnly,
      ensureDefaults: true,
    });

    return NextResponse.json({ types });
  });
}

export async function POST(request: Request) {
  return withAdminAuth(async () => {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name : "";
    const gender = normalizeProductTypeGender(
      typeof body.gender === "string" ? body.gender : ""
    );
    if (!gender || !PRODUCT_TYPE_GENDERS.includes(gender)) {
      return NextResponse.json(
        { error: "Gender must be MEN or WOMEN" },
        { status: 400 }
      );
    }

    const sortOrder =
      typeof body.sortOrder === "number"
        ? body.sortOrder
        : body.sortOrder !== undefined
          ? Number(body.sortOrder)
          : undefined;
    const active = body.active === undefined ? true : body.active === true;

    const type = await createProductType({
      name,
      gender: gender as ProductTypeGender,
      sortOrder: Number.isFinite(sortOrder as number)
        ? (sortOrder as number)
        : undefined,
      active,
    });

    return NextResponse.json({ type }, { status: 201 });
  });
}
