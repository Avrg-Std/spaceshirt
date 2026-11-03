export const PRODUCT_SIZE_OPTIONS = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
  "ONE SIZE",
] as const;

export const PRODUCT_COLLECTIONS = ["Winter", "Summer"] as const;
export type ProductCollection = (typeof PRODUCT_COLLECTIONS)[number];

export type ProductSize = (typeof PRODUCT_SIZE_OPTIONS)[number];
export type SizeStockMap = Partial<Record<ProductSize, number>>;

const SIZE_ALIASES: Record<string, ProductSize> = {
  XS: "XS",
  XSMALL: "XS",
  "X-SMALL": "XS",
  S: "S",
  SMALL: "S",
  M: "M",
  MEDIUM: "M",
  L: "L",
  LARGE: "L",
  XL: "XL",
  XXL: "XXL",
  "2XL": "XXL",
  "3XL": "3XL",
  XXXL: "3XL",
  "4XL": "4XL",
  XXXXL: "4XL",
  "5XL": "5XL",
  XXXXXL: "5XL",
  "6XL": "6XL",
  XXXXXXL: "6XL",
  "ONE SIZE": "ONE SIZE",
  ONESIZE: "ONE SIZE",
  OS: "ONE SIZE",
};

export function normalizeSizeLabel(value: string): string {
  const trimmed = value.trim().toUpperCase().replace(/\s+/g, " ");
  return SIZE_ALIASES[trimmed] ?? trimmed;
}

export function normalizeCollection(value: string): ProductCollection | null {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "winter") return "Winter";
  if (trimmed === "summer") return "Summer";
  return null;
}

const CATEGORY_ALIASES: Record<string, string> = {
  man: "MEN",
  men: "MEN",
  woman: "WOMEN",
  women: "WOMEN",
};

/** Canonicalize category labels (e.g. Man/MAN → MEN, Woman/WOMAN → WOMEN). */
export function normalizeCategory(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return CATEGORY_ALIASES[trimmed.toLowerCase()] ?? trimmed;
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
