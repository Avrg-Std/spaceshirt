import { NextResponse } from "next/server";
import {
  deleteProduct,
  getProductByRecordId,
  PRODUCT_SIZE_OPTIONS,
  sanitizeSizeStock,
  updateProduct,
  type ProductInput,
  type ProductSize,
  type SizeStockMap,
} from "@/lib/airtable";
import { withAdminAuth } from "@/lib/admin-api";

function parseSizeStock(value: unknown): SizeStockMap | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const entries = value as Record<string, unknown>;
  const parsed: SizeStockMap = {};

  for (const size of PRODUCT_SIZE_OPTIONS) {
    if (entries[size] === undefined) continue;
    const qty =
      typeof entries[size] === "number" ? entries[size] : Number(entries[size]);
    if (Number.isFinite(qty) && qty >= 0) {
      parsed[size as ProductSize] = Math.floor(qty as number);
    }
  }

  return sanitizeSizeStock(parsed);
}

function parseProductPatch(body: Record<string, unknown>): Partial<ProductInput> {
  const patch: Partial<ProductInput> = {};

  if (typeof body.title === "string") patch.title = body.title.trim();
  if (typeof body.description === "string") patch.description = body.description.trim();
  if (typeof body.category === "string") patch.category = body.category.trim();
  if (body.price !== undefined) {
    const price = typeof body.price === "number" ? body.price : Number(body.price);
    if (!Number.isFinite(price)) throw new Error("Valid price is required");
    patch.price = price;
  }
  if (body.rating !== undefined) {
    patch.rating =
      body.rating === null
        ? null
        : typeof body.rating === "number"
          ? body.rating
          : Number(body.rating);
  }
  if (typeof body.image === "string") patch.image = body.image.trim();
  if (body.sizeStock !== undefined) {
    patch.sizeStock = parseSizeStock(body.sizeStock) ?? {};
  }
  if (body.featured !== undefined) patch.featured = body.featured === true;
  if (body.featuredOrder !== undefined) {
    patch.featuredOrder =
      typeof body.featuredOrder === "number" ? body.featuredOrder : null;
  }
  if (body.showOnNewest !== undefined) patch.showOnNewest = body.showOnNewest === true;
  if (body.newestOrder !== undefined) {
    patch.newestOrder =
      typeof body.newestOrder === "number" ? body.newestOrder : null;
  }

  return patch;
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  return withAdminAuth(async () => {
    const { id } = await context.params;
    const product = await getProductByRecordId(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  return withAdminAuth(async () => {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const patch = parseProductPatch(body);
    const product = await updateProduct(id, patch);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  return withAdminAuth(async () => {
    const { id } = await context.params;
    const deleted = await deleteProduct(id);
    if (!deleted) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  });
}
