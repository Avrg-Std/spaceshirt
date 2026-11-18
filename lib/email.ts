import "server-only";
import { Resend } from "resend";
import {
  getOrderNotifyEmails,
  type CustomerOrder,
} from "@/lib/airtable";

const DEFAULT_FROM = "Ciao-lu <orders@notify.ciao-lu.com>";
const DEFAULT_REPLY_TO = "Ciao-lu <orders@notify.ciao-lu.com>";
const DEFAULT_TEMPLATE_ALIAS = "order-confirmation";

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function money(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildItemsHtml(order: CustomerOrder): string {
  if (order.items.length === 0) {
    return `<p style="margin:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#444444;">${escapeHtml(order.itemsText || "See order details")}</p>`;
  }

  return order.items
    .map((item) => {
      const lineTotal = money(item.price * item.quantity);
      return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;border-bottom:1px solid #eeeeee;">
<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#111111;padding-top:8px;padding-bottom:8px;">
<strong>${escapeHtml(item.title)}</strong><br>
<span style="color:#666666;">Size: ${escapeHtml(item.size)} · Qty: ${item.quantity}</span>
</td>
<td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#111111;padding-top:8px;padding-bottom:8px;">${lineTotal}</td>
</tr>
</table>`;
    })
    .join("");
}

function buildItemsText(order: CustomerOrder): string {
  if (order.items.length === 0) {
    return order.itemsText || "See order details";
  }

  return order.items
    .map(
      (item) =>
        `- ${item.title} | Size: ${item.size} | Qty: ${item.quantity} | ${money(item.price * item.quantity)}`
    )
    .join("\n");
}

function statusNote(order: CustomerOrder): string {
  if (order.paymentMethod === "Whish") {
    return "Your Whish payment was received. We are preparing your order.";
  }
  if (order.paymentMethod === "OMT") {
    return "Your order is placed. Please complete OMT payment as instructed by our team.";
  }
  return "Your order is placed for Cash on Delivery. Shipping is paid separately to the delivery agency.";
}

function shippingLabel(order: CustomerOrder): string {
  if (order.shipping <= 0) return "Paid separately to delivery agency";
  return money(order.shipping);
}

export type SendOrderEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string; skipped?: boolean };

export async function sendOrderConfirmationEmail(
  order: CustomerOrder
): Promise<SendOrderEmailResult> {
  const resend = getResendClient();
  if (!resend) {
    return {
      ok: false,
      skipped: true,
      error: "RESEND_API_KEY is not configured",
    };
  }

  if (!order.email?.trim()) {
    return { ok: false, error: "Order has no email address" };
  }

  const from = process.env.RESEND_FROM?.trim() || DEFAULT_FROM;
  const replyTo = process.env.RESEND_REPLY_TO?.trim() || DEFAULT_REPLY_TO;
  const templateId =
    process.env.RESEND_ORDER_TEMPLATE_ID?.trim() || DEFAULT_TEMPLATE_ALIAS;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [order.email.trim()],
      replyTo: [replyTo],
      subject: `Order ${order.orderId} confirmed — Ciao-lu`,
      template: {
        id: templateId,
        variables: {
          ORDER_ID: order.orderId,
          STATUS_NOTE: statusNote(order),
          ITEMS_HTML: buildItemsHtml(order),
          ITEMS_TEXT: buildItemsText(order),
          SUBTOTAL: money(order.subtotal),
          SHIPPING: shippingLabel(order),
          TOTAL: money(order.total),
          PAYMENT_METHOD: order.paymentMethod,
          PHONE: order.phone,
          LOCATION: order.location,
        },
      },
      tags: [
        { name: "type", value: "order_confirmation" },
        { name: "order_id", value: order.orderId },
      ],
      headers: {
        "X-Entity-Ref-ID": order.orderId,
      },
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id ?? "sent" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

function buildAdminItemsHtml(order: CustomerOrder): string {
  if (order.items.length === 0) {
    return `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#444444;">${escapeHtml(order.itemsText || "See order details")}</p>`;
  }

  return order.items
    .map((item) => {
      const lineTotal = money(item.price * item.quantity);
      return `<tr>
<td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#111111;padding:6px 0;border-bottom:1px solid #eeeeee;">
${escapeHtml(item.title)}<br>
<span style="color:#666666;">Size: ${escapeHtml(item.size)} · Qty: ${item.quantity}</span>
</td>
<td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#111111;padding:6px 0;border-bottom:1px solid #eeeeee;">${lineTotal}</td>
</tr>`;
    })
    .join("");
}

export async function sendOrderAdminNotificationEmail(
  order: CustomerOrder
): Promise<SendOrderEmailResult> {
  const resend = getResendClient();
  if (!resend) {
    return {
      ok: false,
      skipped: true,
      error: "RESEND_API_KEY is not configured",
    };
  }

  let recipients: string[];
  try {
    recipients = await getOrderNotifyEmails();
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load notification recipients",
    };
  }

  if (recipients.length === 0) {
    return {
      ok: false,
      skipped: true,
      error: "No order notification recipients configured",
    };
  }

  const from = process.env.RESEND_FROM?.trim() || DEFAULT_FROM;
  const replyTo = process.env.RESEND_REPLY_TO?.trim() || DEFAULT_REPLY_TO;
  const shipping = shippingLabel(order);

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#111111;max-width:560px;margin:0 auto;">
<h1 style="font-size:22px;margin:0 0 16px 0;">New order ${escapeHtml(order.orderId)}</h1>
<p style="margin:0 0 12px 0;font-size:14px;line-height:22px;color:#444444;">A customer just placed an order on Ciao-lu.</p>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;font-size:14px;line-height:22px;">
<tr><td style="color:#666666;padding:4px 0;">Customer</td><td align="right">${escapeHtml(order.email)}</td></tr>
<tr><td style="color:#666666;padding:4px 0;">Phone</td><td align="right">${escapeHtml(order.phone || "—")}</td></tr>
<tr><td style="color:#666666;padding:4px 0;">Location</td><td align="right">${escapeHtml(order.location || "—")}</td></tr>
<tr><td style="color:#666666;padding:4px 0;">Payment</td><td align="right">${escapeHtml(order.paymentMethod)}</td></tr>
<tr><td style="color:#666666;padding:4px 0;">Status</td><td align="right">${escapeHtml(order.status)}</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
${buildAdminItemsHtml(order)}
</table>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;font-size:14px;line-height:22px;">
<tr><td style="color:#666666;padding:4px 0;">Subtotal</td><td align="right">${money(order.subtotal)}</td></tr>
<tr><td style="color:#666666;padding:4px 0;">Shipping</td><td align="right">${escapeHtml(shipping)}</td></tr>
<tr><td style="padding:8px 0 0 0;"><strong>Total</strong></td><td align="right" style="padding:8px 0 0 0;"><strong>${money(order.total)}</strong></td></tr>
</table>
</div>`;

  const text = [
    `New order ${order.orderId}`,
    "",
    `Customer: ${order.email}`,
    `Phone: ${order.phone || "—"}`,
    `Location: ${order.location || "—"}`,
    `Payment: ${order.paymentMethod}`,
    `Status: ${order.status}`,
    "",
    buildItemsText(order),
    "",
    `Subtotal: ${money(order.subtotal)}`,
    `Shipping: ${shipping}`,
    `Total: ${money(order.total)}`,
  ].join("\n");

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: recipients,
      replyTo: [replyTo],
      subject: `New order ${order.orderId} — Ciao-lu`,
      html,
      text,
      tags: [
        { name: "type", value: "order_admin_notify" },
        { name: "order_id", value: order.orderId },
      ],
      headers: {
        "X-Entity-Ref-ID": `admin-${order.orderId}`,
      },
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id ?? "sent" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
