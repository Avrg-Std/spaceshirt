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

export const PRODUCT_TYPE_GENDERS = ["MEN", "WOMEN"] as const;
export type ProductTypeGender = (typeof PRODUCT_TYPE_GENDERS)[number];

/** Product type stored in Airtable Collection field. */
export type ProductCollection = string;

export const DEFAULT_PRODUCT_CATEGORIES = [
  "MEN",
  "WOMEN",
  "NEW ARRIVALS",
  "ACCESSORIES",
  "BEST SELLERS",
] as const;

export const DEFAULT_PRODUCT_TYPES: Record<ProductTypeGender, readonly string[]> = {
  MEN: ["T-shirt", "Pants", "Shorts", "Tanks", "Hoodies & jackets"],
  WOMEN: [
    "Sports bras",
    "Leggings",
    "Pants",
    "Shorts",
    "T-shirts & top",
    "Hoodies & jackets",
    "Two sets",
  ],
};

/** @deprecated Prefer DEFAULT_PRODUCT_TYPES — kept empty for any leftover imports. */
export const PRODUCT_COLLECTIONS: readonly string[] = [];

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

/** Normalize a product type name stored in Collection. Empty → null. */
export function normalizeProductType(value: string): ProductCollection | null {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > 0 ? trimmed : null;
}

/** Alias for normalizeProductType — Collection field holds product types. */
export function normalizeCollection(value: string): ProductCollection | null {
  return normalizeProductType(value);
}

export function normalizeProductTypeGender(
  value: string
): ProductTypeGender | null {
  const trimmed = value.trim().toUpperCase();
  if (trimmed === "MEN" || trimmed === "MAN") return "MEN";
  if (trimmed === "WOMEN" || trimmed === "WOMAN") return "WOMEN";
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

/** Alias for normalizeCategory. */
export function canonicalizeCategory(value: string): string {
  return normalizeCategory(value);
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
