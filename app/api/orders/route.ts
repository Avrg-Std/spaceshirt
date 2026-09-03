import { NextResponse } from "next/server";
import {
  createCustomerOrder,
  getSizeInventoryForProduct,
  normalizeSizeLabel,
  PRODUCT_SIZE_OPTIONS,
  reserveStockForOrderItems,
  restoreStockForOrderItems,
  updateOrderStatus,
  type PaymentMethodLabel,
  type ProductSize,
} from "@/lib/airtable";
import { getWebsiteUrl, getWhishClient, generateMockExternalId, isWhishConfigured, isWhishMockMode } from "@/lib/whish";

const PAYMENT_METHODS: PaymentMethodLabel[] = [
  "Cash on Delivery",
  "OMT",
  "Whish",
];

type OrderItemBody = {
  id: string;
  title: string;
  size: string;
  quantity: number;
  price: number;
};

type CreateOrderBody = {
  email?: string;
  phone?: string;
  location?: string;
  paymentMethod?: string;
  subtotal?: number;
  shipping?: number;
  total?: number;
  items?: OrderItemBody[];
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function assertItemsInStock(items: OrderItemBody[]): Promise<void> {
  for (const item of items) {
    const size = normalizeSizeLabel(item.size) as ProductSize;
    if (!(PRODUCT_SIZE_OPTIONS as readonly string[]).includes(size)) {
      throw new Error(`Unsupported size "${item.size}" for ${item.title}`);
    }

    const sizeStock = await getSizeInventoryForProduct(item.id);
    const available = sizeStock[size] ?? 0;
    if (available < item.quantity) {
      throw new Error(
        `Not enough stock for ${item.title} (${size}). Available: ${available}, requested: ${item.quantity}`
      );
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderBody;

    const email = body.email?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";
    const location = body.location?.trim() ?? "";
    const paymentMethod = body.paymentMethod?.trim() ?? "";
    const items = Array.isArray(body.items) ? body.items : [];

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!phone || phone.replace(/\D/g, "").length < 8) {
      return NextResponse.json({ error: "Valid phone number is required" }, { status: 400 });
    }
    if (!location) {
      return NextResponse.json({ error: "Location is required" }, { status: 400 });
    }
    if (!PAYMENT_METHODS.includes(paymentMethod as PaymentMethodLabel)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }
    if (items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    for (const item of items) {
      if (
        !item?.id ||
        !item?.title ||
        !item?.size ||
        typeof item.quantity !== "number" ||
        item.quantity < 1 ||
        typeof item.price !== "number"
      ) {
        return NextResponse.json({ error: "Invalid cart items" }, { status: 400 });
      }
      item.size = normalizeSizeLabel(item.size);
    }

    try {
      await assertItemsInStock(items);
    } catch (stockError) {
      const message =
        stockError instanceof Error ? stockError.message : "Insufficient stock";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const subtotal =
      typeof body.subtotal === "number"
        ? body.subtotal
        : items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = typeof body.shipping === "number" ? body.shipping : 0;
    const total = typeof body.total === "number" ? body.total : subtotal + shipping;

    await reserveStockForOrderItems(items);

    const rollbackStock = async () => {
      await restoreStockForOrderItems(
        items.map((item) => ({
          productId: item.id,
          title: item.title,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
        }))
      );
    };

    if (paymentMethod === "Whish") {
      if (!isWhishConfigured()) {
        await rollbackStock();
        return NextResponse.json(
          {
            error:
              "Whish Pay is not configured yet. Add WHISH_CHANNEL, WHISH_SECRET, and WEBSITE_URL.",
          },
          { status: 503 }
        );
      }

      const websiteUrl = getWebsiteUrl();
      const headerOrigin = request.headers.get("origin")?.replace(/\/$/, "");
      const forwardedHost = request.headers.get("x-forwarded-host");
      const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
      const requestOrigin =
        headerOrigin ||
        (forwardedHost ? `${forwardedProto}://${forwardedHost}` : websiteUrl);

      let createdOrder: Awaited<ReturnType<typeof createCustomerOrder>> | null =
        null;

      try {
        if (isWhishMockMode()) {
          const externalId = generateMockExternalId();
          createdOrder = await createCustomerOrder({
            email,
            phone,
            location,
            paymentMethod: "Whish",
            subtotal,
            shipping,
            total,
            items,
            status: "Awaiting Payment",
            whishExternalId: String(externalId),
          });

          const successRedirectUrl = `${requestOrigin}/cart?whish=success&orderId=${encodeURIComponent(createdOrder.orderId)}`;
          const failureRedirectUrl = `${requestOrigin}/cart?whish=failed&orderId=${encodeURIComponent(createdOrder.orderId)}`;
          const paymentUrl =
            `${requestOrigin}/checkout/whish-mock` +
            `?orderId=${encodeURIComponent(createdOrder.orderId)}` +
            `&externalId=${encodeURIComponent(String(externalId))}` +
            `&amount=${encodeURIComponent(String(total))}` +
            `&successUrl=${encodeURIComponent(successRedirectUrl)}` +
            `&failureUrl=${encodeURIComponent(failureRedirectUrl)}`;

          return NextResponse.json(
            {
              order: createdOrder,
              paymentUrl,
              externalId,
              mock: true,
            },
            { status: 201 }
          );
        }

        const whish = await getWhishClient();
        const externalId = whish.generateExternalId();

        createdOrder = await createCustomerOrder({
          email,
          phone,
          location,
          paymentMethod: "Whish",
          subtotal,
          shipping,
          total,
          items,
          status: "Awaiting Payment",
          whishExternalId: String(externalId),
        });

        const callbackQuery = `externalId=${encodeURIComponent(externalId)}&currency=USD`;
        const payment = await whish.createPayment({
          amount: total,
          currency: "USD",
          invoice: `Order ${createdOrder.orderId}`,
          externalId,
          successCallbackUrl: `${websiteUrl}/api/whish/callback/success?${callbackQuery}`,
          failureCallbackUrl: `${websiteUrl}/api/whish/callback/failure?${callbackQuery}`,
          successRedirectUrl: `${websiteUrl}/cart?whish=success&orderId=${encodeURIComponent(createdOrder.orderId)}`,
          failureRedirectUrl: `${websiteUrl}/cart?whish=failed&orderId=${encodeURIComponent(createdOrder.orderId)}`,
        });

        if (!payment.success || !payment.collectUrl) {
          // Cancel restores reserved stock once (do not also rollbackStock).
          await updateOrderStatus(createdOrder.id, "Cancelled");
          return NextResponse.json(
            {
              error: payment.dialog?.message ?? "Failed to start Whish payment",
              code: payment.code,
            },
            { status: 400 }
          );
        }

        return NextResponse.json(
          {
            order: createdOrder,
            paymentUrl: payment.collectUrl,
            externalId,
          },
          { status: 201 }
        );
      } catch (error) {
        if (createdOrder) {
          // Order exists: cancel restores stock. Avoid double-restore via rollbackStock.
          try {
            await updateOrderStatus(createdOrder.id, "Cancelled");
          } catch {
            await rollbackStock();
          }
        } else {
          await rollbackStock();
        }
        throw error;
      }
    }

    try {
      const order = await createCustomerOrder({
        email,
        phone,
        location,
        paymentMethod: paymentMethod as PaymentMethodLabel,
        subtotal,
        shipping,
        total,
        items,
        status: "Pending",
      });

      return NextResponse.json({ order }, { status: 201 });
    } catch (error) {
      await rollbackStock();
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    const status = message.toLowerCase().includes("stock") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
