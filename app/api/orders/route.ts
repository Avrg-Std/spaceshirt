import { NextResponse } from "next/server";
import {
  createCustomerOrder,
  type PaymentMethodLabel,
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
    }

    const subtotal =
      typeof body.subtotal === "number"
        ? body.subtotal
        : items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = typeof body.shipping === "number" ? body.shipping : 0;
    const total = typeof body.total === "number" ? body.total : subtotal + shipping;

    if (paymentMethod === "Whish") {
      if (!isWhishConfigured()) {
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

      if (isWhishMockMode()) {
        const externalId = generateMockExternalId();
        const order = await createCustomerOrder({
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

        const successRedirectUrl = `${requestOrigin}/cart?whish=success&orderId=${encodeURIComponent(order.orderId)}`;
        const failureRedirectUrl = `${requestOrigin}/cart?whish=failed&orderId=${encodeURIComponent(order.orderId)}`;
        const paymentUrl =
          `${requestOrigin}/checkout/whish-mock` +
          `?orderId=${encodeURIComponent(order.orderId)}` +
          `&externalId=${encodeURIComponent(String(externalId))}` +
          `&amount=${encodeURIComponent(String(total))}` +
          `&successUrl=${encodeURIComponent(successRedirectUrl)}` +
          `&failureUrl=${encodeURIComponent(failureRedirectUrl)}`;

        return NextResponse.json(
          {
            order,
            paymentUrl,
            externalId,
            mock: true,
          },
          { status: 201 }
        );
      }

      const whish = getWhishClient();
      const externalId = whish.generateExternalId();

      const order = await createCustomerOrder({
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

      const payment = await whish.createPayment({
        amount: total,
        currency: "USD",
        invoice: `Order ${order.orderId}`,
        externalId,
        successCallbackUrl: `${websiteUrl}/api/whish/callback/success`,
        failureCallbackUrl: `${websiteUrl}/api/whish/callback/failure`,
        successRedirectUrl: `${websiteUrl}/cart?whish=success&orderId=${encodeURIComponent(order.orderId)}`,
        failureRedirectUrl: `${websiteUrl}/cart?whish=failed&orderId=${encodeURIComponent(order.orderId)}`,
      });

      if (!payment.success || !payment.collectUrl) {
        return NextResponse.json(
          {
            error: payment.dialog?.message ?? "Failed to start Whish payment",
            code: payment.code,
            order,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          order,
          paymentUrl: payment.collectUrl,
          externalId,
        },
        { status: 201 }
      );
    }

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
    const message = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
