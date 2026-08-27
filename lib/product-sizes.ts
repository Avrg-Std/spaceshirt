export const PRODUCT_SIZE_OPTIONS = [
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "ONE SIZE",
] as const;

export type ProductSize = (typeof PRODUCT_SIZE_OPTIONS)[number];
export type SizeStockMap = Partial<Record<ProductSize, number>>;

export function normalizeSizeLabel(value: string): string {
  const trimmed = value.trim().toUpperCase();
  if (trimmed === "ONE SIZE" || trimmed === "ONESIZE" || trimmed === "OS") {
    return "ONE SIZE";
  }
  return trimmed;
}

export function sumSizeStock(sizeStock: SizeStockMap): number {
  return Object.values(sizeStock).reduce((sum, qty) => sum + (qty ?? 0), 0);
}

export function sizesFromStock(sizeStock: SizeStockMap): string[] {
  return PRODUCT_SIZE_OPTIONS.filter((size) => (sizeStock[size] ?? 0) > 0);
}

export function sanitizeSizeStock(input: SizeStockMap | undefined): SizeStockMap {
  const result: SizeStockMap = {};
  if (!input) return result;

  for (const size of PRODUCT_SIZE_OPTIONS) {
    const raw = input[size];
    if (raw === undefined || raw === null) continue;
    const qty = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(qty) || qty < 0) continue;
    result[size] = Math.floor(qty);
  }

  return result;
}
