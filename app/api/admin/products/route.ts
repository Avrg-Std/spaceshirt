import { NextResponse } from "next/server";
import {
  createProduct,
  getProducts,
  PRODUCT_SIZE_OPTIONS,
  sanitizeSizeStock,
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

function parseProductInput(body: Record<string, unknown>): ProductInput {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const price = typeof body.price === "number" ? body.price : Number(body.price);
  const rating =
    body.rating === null || body.rating === undefined
      ? null
      : typeof body.rating === "number"
        ? body.rating
        : Number(body.rating);
  const image = typeof body.image === "string" ? body.image.trim() : undefined;
  const sizeStock = parseSizeStock(body.sizeStock);

  if (!title) throw new Error("Title is required");
  if (!Number.isFinite(price)) throw new Error("Valid price is required");

  return {
    title,
    description,
    category: category || "Uncategorized",
    price,
    rating: Number.isFinite(rating as number) ? (rating as number) : null,
    image,
    sizeStock,
    featured: body.featured === true,
    featuredOrder:
      typeof body.featuredOrder === "number" ? body.featuredOrder : null,
    showOnNewest: body.showOnNewest === true,
    newestOrder:
      typeof body.newestOrder === "number" ? body.newestOrder : null,
  };
}

export async function GET() {
  return withAdminAuth(async () => {
    const products = await getProducts();
    return NextResponse.json({ products });
  });
}

export async function POST(request: Request) {
  return withAdminAuth(async () => {
    const body = (await request.json()) as Record<string, unknown>;
    const input = parseProductInput(body);
    const product = await createProduct(input);
    return NextResponse.json({ product }, { status: 201 });
  });
}
