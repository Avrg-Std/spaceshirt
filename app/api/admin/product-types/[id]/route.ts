import { NextResponse } from "next/server";
import {
  deleteProductType,
  normalizeProductTypeGender,
  PRODUCT_TYPE_GENDERS,
  updateProductType,
  type ProductTypeGender,
} from "@/lib/airtable";
import { withAdminAuth } from "@/lib/admin-api";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  return withAdminAuth(async () => {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;

    const patch: {
      name?: string;
      gender?: ProductTypeGender;
      sortOrder?: number;
      active?: boolean;
    } = {};

    if (typeof body.name === "string") patch.name = body.name;

    if (typeof body.gender === "string") {
      const gender = normalizeProductTypeGender(body.gender);
      if (!gender || !PRODUCT_TYPE_GENDERS.includes(gender)) {
        return NextResponse.json(
          { error: "Gender must be MEN or WOMEN" },
          { status: 400 }
        );
      }
      patch.gender = gender;
    }

    if (body.sortOrder !== undefined) {
      const sortOrder =
        typeof body.sortOrder === "number"
          ? body.sortOrder
          : Number(body.sortOrder);
      if (!Number.isFinite(sortOrder)) {
        return NextResponse.json(
          { error: "Valid sort order is required" },
          { status: 400 }
        );
      }
      patch.sortOrder = Math.floor(sortOrder);
    }

    if (body.active !== undefined) {
      patch.active = body.active === true;
    }

    const type = await updateProductType(id, patch);
    if (!type) {
      return NextResponse.json({ error: "Product type not found" }, { status: 404 });
    }

    return NextResponse.json({ type });
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  return withAdminAuth(async () => {
    const { id } = await context.params;
    const deleted = await deleteProductType(id);
    if (!deleted) {
      return NextResponse.json({ error: "Product type not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  });
}
