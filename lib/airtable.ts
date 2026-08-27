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
  featured: boolean;
  featuredOrder: number | null;
  showOnNewest: boolean;
  newestOrder: number | null;
};

export type ProductInput = {
  title: string;
  price: number;
  description: string;
  category: string;
  image?: string;
  stock?: number | null;
  sizes?: string[];
  rating?: number | null;
  featured?: boolean;
  featuredOrder?: number | null;
  showOnNewest?: boolean;
  newestOrder?: number | null;
};

export type OrderStatus =
  | "Pending"
  | "Awaiting Payment"
  | "Confirmed"
  | "Shipped"
  | "Cancelled";

export type OrderLineItem = {
  title: string;
  size: string;
  quantity: number;
  price: number;
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

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "yes" || normalized === "1";
  }
  return false;
}

function getProductsTablePath(): string {
  const baseId = requiredEnv("AIRTABLE_BASE_ID");
  const tableName = requiredEnv("AIRTABLE_TABLE_NAME");
  return `${baseId}/${encodeURIComponent(tableName)}`;
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
  const image =
    imageFromField(
      getField(record, ["Images", "Image 1", "Image 2", "images", "Image", "Photo"])
    ) ?? "/images/image 1.jpeg";
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
    featured: toBoolean(getField(record, ["Featured"])),
    featuredOrder: toNumber(getField(record, ["Featured Order"])),
    showOnNewest: toBoolean(getField(record, ["Show on Newest"])),
    newestOrder: toNumber(getField(record, ["Newest Order"])),
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

async function deleteAirtableRecord(path: string, recordId: string): Promise<void> {
  const token = requiredEnv("AIRTABLE_TOKEN");
  const query = new URLSearchParams();
  query.set("records[]", recordId);

  const response = await fetch(`${AIRTABLE_API_BASE}/${path}?${query.toString()}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Airtable request failed (${response.status}): ${errorBody}`);
  }
}

async function fetchAirtableRecord(path: string): Promise<AirtableRecord | null> {
  const token = requiredEnv("AIRTABLE_TOKEN");

  const response = await fetch(`${AIRTABLE_API_BASE}/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Airtable request failed (${response.status}): ${body}`);
  }

  return (await response.json()) as AirtableRecord;
}

function productInputToFields(
  input: ProductInput,
  options?: { includeCuration?: boolean }
): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    "Product Name": input.title,
    Price: input.price,
    Description: input.description,
    Category: input.category,
  };

  if (input.stock !== undefined) {
    fields.Stock = input.stock;
  }

  if (input.sizes !== undefined) {
    // Airtable "Sizes" is a multipleSelects field — write an array of choice names.
    fields.Sizes = input.sizes;
  }

  if (input.rating !== undefined && input.rating !== null) {
    fields.Rating = input.rating;
  }

  // Airtable "Images" is singleLineText (URL), not an attachment field.
  if (input.image !== undefined) {
    fields.Images = input.image.trim();
  }

  if (options?.includeCuration) {
    if (input.featured !== undefined) {
      fields.Featured = input.featured;
    }

    if (input.featuredOrder !== undefined) {
      fields["Featured Order"] = input.featuredOrder;
    }

    if (input.showOnNewest !== undefined) {
      fields["Show on Newest"] = input.showOnNewest;
    }

    if (input.newestOrder !== undefined) {
      fields["Newest Order"] = input.newestOrder;
    }
  }

  return fields;
}

async function mutateAirtable(
  path: string,
  method: "POST" | "PATCH",
  body: unknown
): Promise<AirtableListResponse> {
  const token = requiredEnv("AIRTABLE_TOKEN");

  const response = await fetch(`${AIRTABLE_API_BASE}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Airtable request failed (${response.status}): ${errorBody}`);
  }

  return (await response.json()) as AirtableListResponse;
}

export type PaymentMethodLabel = "Cash on Delivery" | "OMT" | "Whish";

export type CreateCustomerOrderInput = {
  email: string;
  phone: string;
  location: string;
  paymentMethod: PaymentMethodLabel;
  subtotal: number;
  shipping: number;
  total: number;
  status?: string;
  whishExternalId?: string;
  items: Array<{
    id: string;
    title: string;
    size: string;
    quantity: number;
    price: number;
  }>;
};

export type CustomerOrder = {
  id: string;
  orderId: string;
  email: string;
  phone: string;
  location: string;
  paymentMethod: PaymentMethodLabel;
  status: string;
  subtotal: number;
  shipping: number;
  total: number;
  whishExternalId?: string;
  items: OrderLineItem[];
  itemsText: string;
  orderDate: string | null;
  productIds: string[];
};

export type CustomerSummary = {
  email: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
};

function getOrdersTablePath(): string {
  const baseId = requiredEnv("AIRTABLE_BASE_ID");
  const tableName =
    process.env.AIRTABLE_ORDERS_TABLE_NAME?.trim() || "Customer Orders";
  return `${baseId}/${encodeURIComponent(tableName)}`;
}

function parseOrderItems(itemsText: string): OrderLineItem[] {
  if (!itemsText.trim()) return [];

  return itemsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(
        /^(.*?)\s\|\sSize:\s(.*?)\s\|\sQty:\s(\d+)\s\|\s\$([0-9.]+)$/
      );

      if (!match) {
        return {
          title: line,
          size: "-",
          quantity: 1,
          price: 0,
        };
      }

      return {
        title: match[1].trim(),
        size: match[2].trim(),
        quantity: Number(match[3]),
        price: Number(match[4]),
      };
    });
}

function mapRecordToCustomerOrder(record: AirtableRecord): CustomerOrder {
  const paymentMethod = firstString(record.fields["Payment Method"]) as
    | PaymentMethodLabel
    | null;
  const itemsText = firstString(record.fields.Items) ?? "";
  const productIds = Array.isArray(record.fields.Products)
    ? record.fields.Products.filter(
        (item): item is string => typeof item === "string" && isAirtableRecordId(item)
      )
    : [];

  return {
    id: record.id,
    orderId: firstString(record.fields["Order ID"]) ?? "",
    email: firstString(record.fields.Email) ?? "",
    phone: firstString(record.fields.Phone) ?? "",
    location: firstString(record.fields.Location) ?? "",
    paymentMethod: paymentMethod ?? "Cash on Delivery",
    status: firstString(record.fields.Status) ?? "Pending",
    subtotal: toNumber(record.fields.Subtotal) ?? 0,
    shipping: toNumber(record.fields.Shipping) ?? 0,
    total: toNumber(record.fields.Total) ?? 0,
    whishExternalId: firstString(record.fields["Whish External ID"]) ?? undefined,
    itemsText,
    items: parseOrderItems(itemsText),
    orderDate: firstString(record.fields["Order Date"]),
    productIds,
  };
}

function generateOrderId(): string {
  const now = new Date();
  const datePart = [
    String(now.getFullYear()).slice(-2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CL-${datePart}-${randomPart}`;
}

function isAirtableRecordId(value: string): boolean {
  return /^rec[A-Za-z0-9]{14}$/.test(value);
}

function formatOrderItems(
  items: CreateCustomerOrderInput["items"]
): string {
  return items
    .map(
      (item) =>
        `${item.title} | Size: ${item.size} | Qty: ${item.quantity} | $${item.price.toFixed(2)}`
    )
    .join("\n");
}

export async function createCustomerOrder(
  input: CreateCustomerOrderInput
): Promise<CustomerOrder> {
  const orderId = generateOrderId();
  const status = input.status ?? "Pending";

  const productRecordIds = Array.from(
    new Set(input.items.map((item) => item.id).filter(isAirtableRecordId))
  );

  const fields: Record<string, unknown> = {
    "Order ID": orderId,
    Email: input.email,
    Phone: input.phone,
    Location: input.location,
    "Payment Method": input.paymentMethod,
    Status: status,
    Subtotal: input.subtotal,
    Shipping: input.shipping,
    Total: input.total,
    Items: formatOrderItems(input.items),
    "Order Date": new Date().toISOString(),
  };

  if (input.whishExternalId) {
    fields["Whish External ID"] = input.whishExternalId;
  }

  if (productRecordIds.length > 0) {
    fields.Products = productRecordIds;
  }

  const data = await mutateAirtable(getOrdersTablePath(), "POST", {
    records: [{ fields }],
    typecast: true,
  });

  const record = data.records[0];
  if (!record) {
    throw new Error("Airtable did not return a created order record");
  }

  return {
    id: record.id,
    orderId,
    email: input.email,
    phone: input.phone,
    location: input.location,
    paymentMethod: input.paymentMethod,
    status,
    subtotal: input.subtotal,
    shipping: input.shipping,
    total: input.total,
    whishExternalId: input.whishExternalId,
    itemsText: formatOrderItems(input.items),
    items: input.items.map((item) => ({
      title: item.title,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
    })),
    orderDate: new Date().toISOString(),
    productIds: productRecordIds,
  };
}

export async function getCustomerOrderByWhishExternalId(
  whishExternalId: string | number
): Promise<CustomerOrder | null> {
  const externalId = String(whishExternalId);
  const query = new URLSearchParams();
  query.set("pageSize", "1");
  query.set("filterByFormula", `{Whish External ID} = "${externalId.replace(/"/g, '\\"')}"`);

  const data = await fetchAirtable(`${getOrdersTablePath()}?${query.toString()}`);
  const record = data.records[0];
  return record ? mapRecordToCustomerOrder(record) : null;
}

export async function updateCustomerOrderStatusByWhishExternalId(
  whishExternalId: string | number,
  status: string
): Promise<CustomerOrder | null> {
  const existing = await getCustomerOrderByWhishExternalId(whishExternalId);
  if (!existing) return null;

  const data = await mutateAirtable(getOrdersTablePath(), "PATCH", {
    records: [
      {
        id: existing.id,
        fields: { Status: status },
      },
    ],
    typecast: true,
  });

  const record = data.records[0];
  return record ? mapRecordToCustomerOrder(record) : existing;
}

export async function getProducts(): Promise<Product[]> {
  const tablePath = getProductsTablePath();

  const products: Product[] = [];
  let offset: string | undefined;

  do {
    const query = new URLSearchParams();
    query.set("pageSize", "100");
    if (offset) query.set("offset", offset);

    const data = await fetchAirtable(`${tablePath}?${query.toString()}`);
    products.push(...data.records.map(mapRecordToProduct));
    offset = data.offset;
  } while (offset);

  return products;
}

export async function getProductByRecordId(id: string): Promise<Product | null> {
  const record = await fetchAirtableRecord(`${getProductsTablePath()}/${id}`);
  return record ? mapRecordToProduct(record) : null;
}

export async function getProductById(id: string): Promise<Product | null> {
  if (isAirtableRecordId(id)) {
    const product = await getProductByRecordId(id);
    if (product) return product;
  }

  const products = await getProducts();
  return products.find((product) => product.id === id) ?? null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const includeCuration =
    input.featured !== undefined ||
    input.featuredOrder !== undefined ||
    input.showOnNewest !== undefined ||
    input.newestOrder !== undefined;

  const data = await mutateAirtable(getProductsTablePath(), "POST", {
    records: [{ fields: productInputToFields(input, { includeCuration }) }],
    typecast: true,
  });

  const record = data.records[0];
  if (!record) {
    throw new Error("Airtable did not return a created product record");
  }

  return mapRecordToProduct(record);
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Promise<Product | null> {
  const existing = await getProductByRecordId(id);
  if (!existing) return null;

  const includeCuration =
    input.featured !== undefined ||
    input.featuredOrder !== undefined ||
    input.showOnNewest !== undefined ||
    input.newestOrder !== undefined;

  const merged: ProductInput = {
    title: input.title ?? existing.title,
    price: input.price ?? existing.price,
    description: input.description ?? existing.description,
    category: input.category ?? existing.category,
    image: input.image !== undefined ? input.image : existing.image,
    stock: input.stock !== undefined ? input.stock : existing.stock,
    sizes: input.sizes ?? existing.sizes,
    rating: input.rating !== undefined ? input.rating : existing.rating,
    featured: input.featured !== undefined ? input.featured : existing.featured,
    featuredOrder:
      input.featuredOrder !== undefined ? input.featuredOrder : existing.featuredOrder,
    showOnNewest:
      input.showOnNewest !== undefined ? input.showOnNewest : existing.showOnNewest,
    newestOrder:
      input.newestOrder !== undefined ? input.newestOrder : existing.newestOrder,
  };

  const data = await mutateAirtable(getProductsTablePath(), "PATCH", {
    records: [{ id, fields: productInputToFields(merged, { includeCuration }) }],
    typecast: true,
  });

  const record = data.records[0];
  return record ? mapRecordToProduct(record) : existing;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const existing = await getProductByRecordId(id);
  if (!existing) return false;

  await deleteAirtableRecord(getProductsTablePath(), id);
  return true;
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const products = await getProducts();
  return products
    .filter((product) => product.featured)
    .sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999))
    .slice(0, limit);
}

export async function getNewestProducts(limit = 3): Promise<Product[]> {
  const products = await getProducts();
  return products
    .filter((product) => product.showOnNewest)
    .sort((a, b) => (a.newestOrder ?? 999) - (b.newestOrder ?? 999))
    .slice(0, limit);
}

export async function getOrders(options?: { status?: string }): Promise<CustomerOrder[]> {
  const tablePath = getOrdersTablePath();
  const orders: CustomerOrder[] = [];
  let offset: string | undefined;

  do {
    const query = new URLSearchParams();
    query.set("pageSize", "100");
    if (options?.status) {
      query.set(
        "filterByFormula",
        `{Status} = "${options.status.replace(/"/g, '\\"')}"`
      );
    }
    if (offset) query.set("offset", offset);

    const data = await fetchAirtable(`${tablePath}?${query.toString()}`);
    orders.push(...data.records.map(mapRecordToCustomerOrder));
    offset = data.offset;
  } while (offset);

  return orders.sort((a, b) => {
    const aTime = a.orderDate ? Date.parse(a.orderDate) : 0;
    const bTime = b.orderDate ? Date.parse(b.orderDate) : 0;
    return bTime - aTime;
  });
}

export async function getOrderById(recordId: string): Promise<CustomerOrder | null> {
  const record = await fetchAirtableRecord(`${getOrdersTablePath()}/${recordId}`);
  return record ? mapRecordToCustomerOrder(record) : null;
}

export async function getOrderByOrderId(orderId: string): Promise<CustomerOrder | null> {
  const query = new URLSearchParams();
  query.set("pageSize", "1");
  query.set("filterByFormula", `{Order ID} = "${orderId.replace(/"/g, '\\"')}"`);

  const data = await fetchAirtable(`${getOrdersTablePath()}?${query.toString()}`);
  const record = data.records[0];
  return record ? mapRecordToCustomerOrder(record) : null;
}

export async function updateOrderStatus(
  recordId: string,
  status: OrderStatus
): Promise<CustomerOrder | null> {
  const existing = await getOrderById(recordId);
  if (!existing) return null;

  const data = await mutateAirtable(getOrdersTablePath(), "PATCH", {
    records: [{ id: recordId, fields: { Status: status } }],
    typecast: true,
  });

  const record = data.records[0];
  return record ? mapRecordToCustomerOrder(record) : existing;
}

export async function getCustomers(): Promise<CustomerSummary[]> {
  const orders = await getOrders();
  const grouped = new Map<string, CustomerSummary>();

  for (const order of orders) {
    const key = order.email.trim().toLowerCase() || order.phone.trim();
    if (!key) continue;

    const existing = grouped.get(key);
    const orderDate = order.orderDate;

    if (!existing) {
      grouped.set(key, {
        email: order.email,
        phone: order.phone,
        orderCount: 1,
        totalSpent: order.total,
        lastOrderDate: orderDate,
      });
      continue;
    }

    existing.orderCount += 1;
    existing.totalSpent += order.total;
    if (
      orderDate &&
      (!existing.lastOrderDate || Date.parse(orderDate) > Date.parse(existing.lastOrderDate))
    ) {
      existing.lastOrderDate = orderDate;
    }
    if (!existing.phone && order.phone) {
      existing.phone = order.phone;
    }
  }

  return Array.from(grouped.values()).sort((a, b) => {
    const aTime = a.lastOrderDate ? Date.parse(a.lastOrderDate) : 0;
    const bTime = b.lastOrderDate ? Date.parse(b.lastOrderDate) : 0;
    return bTime - aTime;
  });
}

export async function getCustomerOrders(email: string): Promise<CustomerOrder[]> {
  const normalizedEmail = email.trim().toLowerCase();
  const orders = await getOrders();
  return orders.filter((order) => order.email.trim().toLowerCase() === normalizedEmail);
}
