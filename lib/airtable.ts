import "server-only";

const AIRTABLE_API_BASE = "https://api.airtable.com/v0";
const IMAGE_PATH_PATTERN = /\.(avif|bmp|gif|ico|jpe?g|png|svg|tiff?|webp)$/i;
const TRUSTED_IMAGE_HOSTS = new Set([
  "dl.airtable.com",
  "v5.airtableusercontent.com",
  "v6.airtableusercontent.com",
  "res.cloudinary.com",
]);

type AirtableAttachment = {
  url?: string;
};

type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
};

type AirtableListResponse = {
  records: AirtableRecord[];
  offset?: string;
};

export type Product = {
  id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  stock: number | null;
  sizes: string[];
  rating: number | null;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function firstString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && item.trim()) return item.trim();
    }
  }
  return null;
}

function firstAttachmentUrl(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  for (const item of value) {
    if (item && typeof item === "object") {
      const url = (item as AirtableAttachment).url;
      if (typeof url === "string" && url.trim() && isAllowedImageValue(url)) return url;
    }
  }
  return null;
}

function isAllowedImageValue(value: string): boolean {
  const candidate = value.trim();
  if (!candidate) return false;
  if (candidate.startsWith("/")) return true;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

    if (IMAGE_PATH_PATTERN.test(parsed.pathname)) return true;
    if (TRUSTED_IMAGE_HOSTS.has(parsed.hostname.toLowerCase())) return true;

    return false;
  } catch {
    return false;
  }
}

function imageFromField(value: unknown): string | null {
  const attachmentUrl = firstAttachmentUrl(value);
  if (attachmentUrl) return attachmentUrl;

  if (typeof value === "string" && isAllowedImageValue(value)) {
    return value.trim();
  }

  return null;
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,\s/]+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return [];
}

function getField(record: AirtableRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (key in record.fields) return record.fields[key];
  }
  return undefined;
}

function mapRecordToProduct(record: AirtableRecord): Product {
  const title =
    firstString(getField(record, ["Product Name", "Product", "Name", "Title"])) ??
    "Untitled Product";
  const price = toNumber(getField(record, ["Price", "Unit Price"])) ?? 0;
  const description =
    firstString(getField(record, ["Description", "Details", "Summary"])) ??
    "No description available.";
  const category =
    firstString(getField(record, ["Category", "Type"])) ?? "Uncategorized";
  const image = imageFromField(getField(record, ["images", "Images", "Image", "Photo"])) ?? "/images/image 1.jpeg";
  const stock = toNumber(getField(record, ["Stock", "Quantity", "Inventory"]));
  const rating = toNumber(getField(record, ["Rating"]));

  const sizeField = getField(record, ["Size", "Sizes"]);
  const sizes = stringArray(sizeField).map((size) => size.toUpperCase());

  return {
    id: record.id,
    title,
    price,
    description,
    category,
    image,
    stock,
    sizes: sizes.length ? sizes : ["S", "M", "L", "XL"],
    rating,
  };
}

async function fetchAirtable(path: string): Promise<AirtableListResponse> {
  const token = requiredEnv("AIRTABLE_TOKEN");

  const response = await fetch(`${AIRTABLE_API_BASE}/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Airtable request failed (${response.status}): ${body}`);
  }

  return (await response.json()) as AirtableListResponse;
}

export async function getProducts(): Promise<Product[]> {
  const baseId = requiredEnv("AIRTABLE_BASE_ID");
  const tableName = requiredEnv("AIRTABLE_TABLE_NAME");
  const encodedTable = encodeURIComponent(tableName);

  const products: Product[] = [];
  let offset: string | undefined;

  do {
    const query = new URLSearchParams();
    query.set("pageSize", "100");
    if (offset) query.set("offset", offset);

    const data = await fetchAirtable(`${baseId}/${encodedTable}?${query.toString()}`);
    products.push(...data.records.map(mapRecordToProduct));
    offset = data.offset;
  } while (offset);

  return products;
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((product) => product.id === id) ?? null;
}
