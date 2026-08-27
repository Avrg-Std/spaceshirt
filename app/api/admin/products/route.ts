import { NextResponse } from "next/server";
import {
  createProduct,
  getProducts,
  type ProductInput,
} from "@/lib/airtable";
import { withAdminAuth } from "@/lib/admin-api";

function parseProductInput(body: Record<string, unknown>): ProductInput {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const price = typeof body.price === "number" ? body.price : Number(body.price);
  const stock =
    body.stock === null || body.stock === undefined
      ? null
      : typeof body.stock === "number"
        ? body.stock
        : Number(body.stock);
  const rating =
    body.rating === null || body.rating === undefined
      ? null
      : typeof body.rating === "number"
        ? body.rating
        : Number(body.rating);
  const sizes =
    typeof body.sizes === "string"
      ? body.sizes
          .split(/[,\s/]+/)
          .map((size) => size.trim().toUpperCase())
          .filter(Boolean)
      : Array.isArray(body.sizes)
        ? body.sizes
            .filter((size): size is string => typeof size === "string")
            .map((size) => size.trim().toUpperCase())
            .filter(Boolean)
        : undefined;
  const image = typeof body.image === "string" ? body.image.trim() : undefined;

  if (!title) throw new Error("Title is required");
  if (!Number.isFinite(price)) throw new Error("Valid price is required");

  return {
    title,
    description,
    category: category || "Uncategorized",
    price,
    stock: Number.isFinite(stock as number) ? (stock as number) : null,
    rating: Number.isFinite(rating as number) ? (rating as number) : null,
    sizes,
    image,
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
