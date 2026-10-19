import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/generated/prisma/enums";
import { db } from "../db";
import { badRequest, notFound } from "../http/errors";
import { randomToken, transactionId } from "../crypto";
import { invalidate, tags } from "../cache/tags";
import { getUserPlan } from "./plan.service";
import { getOwnedStore } from "./store.service";
import { toOrderDTO } from "./mappers";
import { storeGatewayCreds } from "../payments/credentials";
import { ADAPTERS } from "../payments/adapters";
import type { VerifiedPayment } from "../payments/types";
import { gatewayDef, gatewaySupportsCurrency, gatewaysForCountry, type GatewayKey } from "@/config/payment-gateways";
import type { AuthContext } from "../auth/context";
import type { CheckoutInput, UpdateOrderInput } from "@/schemas/shop";
import { checkoutSchema } from "@/schemas/shop";
import type { PaginationQuery } from "@/schemas/common";
import { absoluteUrl, routes } from "@/config/site";
import { dayjs } from "@/lib/dayjs";

const historyEntry = (status: string, note?: string) => ({ status, at: new Date().toISOString(), ...(note ? { note } : {}) });

/** Public checkout. Prices, shipping and totals are always recomputed server-side. */
/** Is this online gateway usable for this store right now? */
export function storeGatewayAvailable(
  store: { country: string; currency: string; enabledGateways: string[]; gatewaySecrets: string | null },
  key: GatewayKey,
  onlinePaymentsFeature: boolean,
) {
  const def = gatewayDef(key);
  return (
    !!def &&
    onlinePaymentsFeature &&
    store.enabledGateways.includes(key) &&
    gatewaysForCountry(store.country).some((g) => g.key === key) &&
    gatewaySupportsCurrency(def, store.currency) &&
    !!storeGatewayCreds(store, key)
  );
}

export async function placeOrder(raw: CheckoutInput, meta: { ip?: string } = {}) {
  const input = checkoutSchema.parse(raw);
  const store = await db.store.findUnique({
    where: { id: input.storeId },
    include: { profile: { select: { userId: true, username: true, isPublished: true } } },
  });
  if (!store || !store.isActive || !store.profile.isPublished) throw notFound("Shop");

  // Plan limit: monthly orders for the seller
  const { limits, features } = await getUserPlan(store.profile.userId);
  if (limits.monthlyOrders >= 0) {
    const monthCount = await db.order.count({ where: { storeId: store.id, createdAt: { gte: dayjs().startOf("month").toDate() } } });
    if (monthCount >= limits.monthlyOrders) throw badRequest("This shop can't accept more orders this month. Please contact the seller.");
  }

  // Payment method availability
  const method = input.paymentMethod;
  if (method === "COD" && !store.codEnabled) throw badRequest("Cash on delivery is not available");
  if (method === "MANUAL" && !store.manualEnabled) throw badRequest("Manual payment is not available");
  if (method === "ONLINE" && !(input.gateway && storeGatewayAvailable(store, input.gateway, features.onlinePayments))) {
    throw badRequest(`${gatewayDef(input.gateway ?? "")?.name ?? "This payment method"} is not available`);
  }

  // Items
  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const products = await db.product.findMany({ where: { id: { in: productIds }, storeId: store.id, isActive: true } });
  const productMap = new Map(products.map((p) => [p.id, p]));
  const lines = input.items.map((item) => {
    const p = productMap.get(item.productId);
    if (!p) throw badRequest("A product in your cart is no longer available");
    if (p.type === "AFFILIATE") throw badRequest(`"${p.name}" must be bought on the partner site`);
    if (p.stock !== null && p.stock < item.quantity) throw badRequest(`Only ${p.stock} left of "${p.name}"`);
    return { product: p, quantity: item.quantity, options: item.options };
  });
  if (method === "COD" && lines.some((l) => l.product.type === "DIGITAL")) {
    throw badRequest("Cash on delivery isn't available for digital products. Please pay in advance.");
  }
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const onlyDigital = lines.every((l) => l.product.type === "DIGITAL");
  const zoneFee = input.deliveryZone === "inside" ? store.deliveryInside : store.deliveryOutside;
  const shippingFee = onlyDigital || (store.freeShippingMin != null && subtotal >= store.freeShippingMin) ? 0 : zoneFee;
  const total = subtotal + shippingFee;

  const order = await db.$transaction(async (tx) => {
    const seq = await tx.store.update({ where: { id: store.id }, data: { orderSeq: { increment: 1 } }, select: { orderSeq: true } });
    for (const l of lines) {
      if (l.product.stock !== null) {
        const res = await tx.product.updateMany({
          where: { id: l.product.id, stock: { gte: l.quantity } },
          data: { stock: { decrement: l.quantity } },
        });
        if (res.count === 0) throw badRequest(`"${l.product.name}" just went out of stock`);
      }
    }
    return tx.order.create({
      data: {
        storeId: store.id,
        orderNumber: `${store.orderPrefix}-${seq.orderSeq}`,
        trackingToken: randomToken(18),
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail || null,
        address: input.address,
        city: input.city,
        deliveryZone: input.deliveryZone,
        note: input.note || null,
        subtotal,
        shippingFee,
        total,
        currency: store.currency,
        paymentMethod: method,
        gateway: method === "ONLINE" ? input.gateway : null,
        paymentStatus: method === "MANUAL" ? "PENDING_VERIFICATION" : "UNPAID",
        manualPayment:
          method === "MANUAL"
            ? { provider: input.manualProvider!, senderNumber: input.manualSender!, trxId: input.manualTrxId! }
            : undefined,
        transactionId: method === "ONLINE" ? transactionId("ORD") : null,
        history: [historyEntry("PENDING", "Order placed")],
        items: {
          create: lines.map((l) => ({
            productId: l.product.id,
            name: l.product.name,
            image: l.product.images[0] ?? null,
            price: l.product.price,
            quantity: l.quantity,
            options: l.options,
          })),
        },
      },
      include: { items: true },
    });
  });

  invalidate(tags.store(store.profileId));
  const trackUrl = routes.order(store.profile.username, order.trackingToken);

  if (method === "ONLINE" && input.gateway) {
    const key = input.gateway;
    const tran = order.transactionId!;
    try {
      const result = await ADAPTERS[key].init(
        storeGatewayCreds(store, key)!,
        {
          kind: "order",
          transactionId: tran,
          amount: total,
          currency: store.currency,
          customer: { name: input.customerName, phone: input.customerPhone, email: input.customerEmail, address: input.address, city: input.city },
          productName: lines.map((l) => l.product.name).join(", "),
          callbackBase: absoluteUrl(`/api/payments/gateway/${key}/${tran}`),
          clientIp: meta.ip,
        },
        store.gatewaySandbox,
      );
      if (result.gatewayRef) await db.order.update({ where: { id: order.id }, data: { gatewayRef: result.gatewayRef } });
      return { order: toOrderDTO(order), redirectUrl: result.redirectUrl, trackUrl };
    } catch (e) {
      // Gateway unreachable/misconfigured → release stock and cancel so the customer can retry.
      await cancelUnpaidOrder(order.id, "Online payment could not be started");
      throw e;
    }
  }
  return { order: toOrderDTO(order), redirectUrl: null, trackUrl };
}

async function cancelUnpaidOrder(orderId: string, note: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.paymentStatus === "PAID") return;
  await db.$transaction(async (tx) => {
    for (const item of order.items) {
      if (item.productId) await tx.product.updateMany({ where: { id: item.productId, stock: { not: null } }, data: { stock: { increment: item.quantity } } });
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", paymentStatus: "FAILED", history: [...(order.history as object[]), historyEntry("CANCELLED", note)] },
    });
  });
}

/** Gateway callback for shop orders: verify with the gateway API, then settle. Returns the tracking URL. */
export async function settleOrderGateway(key: GatewayKey, tran: string, params: Record<string, string>) {
  const order = await db.order.findUnique({ where: { transactionId: tran }, include: { store: true } });
  if (!order || order.gateway !== key) return null;
  const cancelled = ["cancel", "cancelled", "fail", "failed", "failure"].includes((params.status ?? "").toLowerCase());
  if (cancelled) return failOrderPayment(tran);
  const creds = storeGatewayCreds(order.store, key);
  if (!creds) return failOrderPayment(tran);
  const verified = await ADAPTERS[key].verify(creds, params, {
    sandbox: order.store.gatewaySandbox,
    transactionId: tran,
    gatewayRef: order.gatewayRef,
    currency: order.currency,
  });
  return completeOrderPayment({ ...verified, transactionId: tran });
}

/** Called by gateway callbacks after verification. Idempotent. */
export async function completeOrderPayment(verified: VerifiedPayment) {
  const order = await db.order.findUnique({
    where: { transactionId: verified.transactionId },
    include: { store: { include: { profile: { select: { username: true } } } } },
  });
  if (!order) return null;
  const url = absoluteUrl(routes.order(order.store.profile.username, order.trackingToken));
  if (order.paymentStatus === "PAID") return url;
  if (!verified.ok || verified.amount < order.total) {
    await db.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED", history: [...(order.history as object[]), historyEntry(order.status, "Online payment failed")] },
    });
    return url;
  }
  await db.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      status: order.status === "PENDING" ? "CONFIRMED" : order.status,
      gatewayRef: verified.gatewayRef,
      history: [...(order.history as object[]), historyEntry("CONFIRMED", "Payment received")],
    },
  });
  return url;
}

export async function failOrderPayment(transactionIdValue: string) {
  const order = await db.order.findUnique({
    where: { transactionId: transactionIdValue },
    include: { store: { include: { profile: { select: { username: true } } } } },
  });
  if (!order) return null;
  if (order.paymentStatus !== "PAID") {
    await db.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
  }
  return absoluteUrl(routes.order(order.store.profile.username, order.trackingToken));
}

/** Public "track order" lookup: order number + the phone used at checkout → tracking URL. */
export async function findOrderForTracking(storeId: string, orderNumber: string, phone: string) {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length < 6) throw badRequest("Enter the phone number used for the order");
  const order = await db.order.findFirst({
    where: { storeId, orderNumber: { equals: orderNumber.trim().replace(/^#/, ""), mode: "insensitive" } },
    include: { store: { include: { profile: { select: { username: true } } } } },
  });
  if (!order || !order.customerPhone.replace(/\D/g, "").endsWith(digits)) throw notFound("Order");
  return { trackUrl: routes.order(order.store.profile.username, order.trackingToken) };
}

/** Public tracking (by unguessable token). */
export async function getOrderByToken(token: string) {
  const order = await db.order.findUnique({
    where: { trackingToken: token },
    include: { items: { include: { product: { select: { type: true, digitalUrl: true } } } }, store: true },
  });
  if (!order) return null;
  const digitalDownloads =
    order.paymentStatus === "PAID"
      ? order.items.filter((i) => i.product?.type === "DIGITAL" && i.product.digitalUrl).map((i) => ({ name: i.name, url: i.product!.digitalUrl! }))
      : [];
  return { order: toOrderDTO(order), store: order.store, digitalDownloads };
}

export async function listOrders(auth: AuthContext, storeId: string, q: PaginationQuery & { status?: OrderStatus }) {
  await getOwnedStore(auth, storeId);
  const where: Prisma.OrderWhereInput = {
    storeId,
    ...(q.status ? { status: q.status } : {}),
    ...(q.search
      ? {
          OR: [
            { orderNumber: { contains: q.search, mode: "insensitive" } },
            { customerName: { contains: q.search, mode: "insensitive" } },
            { customerPhone: { contains: q.search } },
          ],
        }
      : {}),
  };
  const [items, total, counts] = await Promise.all([
    db.order.findMany({ where, include: { items: true }, orderBy: { createdAt: q.order }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    db.order.count({ where }),
    db.order.groupBy({ by: ["status"], where: { storeId }, _count: { _all: true } }),
  ]);
  return {
    items: items.map(toOrderDTO),
    total,
    statusCounts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])) as Partial<Record<OrderStatus, number>>,
  };
}

export async function getOrder(auth: AuthContext, orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw notFound("Order");
  await getOwnedStore(auth, order.storeId);
  return toOrderDTO(order);
}

export async function updateOrder(auth: AuthContext, orderId: string, input: UpdateOrderInput) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw notFound("Order");
  await getOwnedStore(auth, order.storeId);
  const history = [...(order.history as object[])];
  if (input.status && input.status !== order.status) history.push(historyEntry(input.status, input.note));
  else if (input.paymentStatus && input.paymentStatus !== order.paymentStatus)
    history.push(historyEntry(order.status, input.note ?? `Payment ${input.paymentStatus.toLowerCase().replace("_", " ")}`));

  // Restock when cancelling/returning an order that had reserved stock
  const restock = input.status && ["CANCELLED", "RETURNED"].includes(input.status) && !["CANCELLED", "RETURNED"].includes(order.status);
  const updated = await db.$transaction(async (tx) => {
    if (restock) {
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.updateMany({ where: { id: item.productId, stock: { not: null } }, data: { stock: { increment: item.quantity } } });
        }
      }
    }
    return tx.order.update({
      where: { id: orderId },
      data: {
        status: input.status,
        paymentStatus: input.paymentStatus ?? (input.status === "DELIVERED" && order.paymentMethod === "COD" ? "PAID" : undefined),
        history,
      },
      include: { items: true },
    });
  });
  return toOrderDTO(updated);
}

export async function storeOrderStats(storeId: string) {
  const since = dayjs().subtract(30, "day").toDate();
  const [pending, last30, revenue] = await Promise.all([
    db.order.count({ where: { storeId, status: "PENDING" } }),
    db.order.count({ where: { storeId, createdAt: { gte: since } } }),
    db.order.aggregate({
      where: { storeId, createdAt: { gte: since }, status: { notIn: ["CANCELLED", "RETURNED"] } },
      _sum: { total: true },
    }),
  ]);
  return { pending, last30, revenue30: revenue._sum.total ?? 0 };
}
