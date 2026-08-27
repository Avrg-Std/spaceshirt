import { NextResponse } from "next/server";
import { getProducts, updateProduct } from "@/lib/airtable";
import { withAdminAuth } from "@/lib/admin-api";

type HomepagePayload = {
  featuredIds?: string[];
  newestIds?: string[];
};

export async function GET() {
  return withAdminAuth(async () => {
    const products = await getProducts();
    return NextResponse.json({ products });
  });
}

export async function POST(request: Request) {
  return withAdminAuth(async () => {
    const body = (await request.json()) as HomepagePayload;
    const featuredIds = Array.isArray(body.featuredIds)
      ? body.featuredIds.slice(0, 4)
      : [];
    const newestIds = Array.isArray(body.newestIds)
      ? body.newestIds.slice(0, 3)
      : [];

    const products = await getProducts();
    const featuredSet = new Set(featuredIds);
    const newestSet = new Set(newestIds);

    await Promise.all(
      products.map((product) =>
        updateProduct(product.id, {
          featured: featuredSet.has(product.id),
          featuredOrder: featuredSet.has(product.id)
            ? featuredIds.indexOf(product.id) + 1
            : null,
          showOnNewest: newestSet.has(product.id),
          newestOrder: newestSet.has(product.id)
            ? newestIds.indexOf(product.id) + 1
            : null,
        })
      )
    );

    return NextResponse.json({ ok: true });
  });
}
