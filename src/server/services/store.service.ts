import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { badRequest, notFound, forbidden } from "../http/errors";
import { encryptJson } from "../crypto";
import { readStoreSecrets } from "../payments/credentials";
import { countryDef, gatewayDef, gatewaySupportsCurrency, gatewaysForCountry, type CurrencyCode } from "@/config/payment-gateways";
import { invalidate, tags } from "../cache/tags";
import { slugify } from "@/lib/utils";
import { assertFeature, assertLimit } from "./plan.service";
import { getOwnedProfile, invalidateProfile } from "./profile.service";
import { toProductDTO, toStoreDTO } from "./mappers";
import type { AuthContext } from "../auth/context";
import {
  productInputSchema,
  storeInputSchema,
  type GatewaySecrets,
  type ProductInput,
  type StoreInput,
} from "@/schemas/shop";

// ── Store ──────────────────────────────────────────────────────────────

export async function getStoreForProfile(auth: AuthContext, profileId: string) {
  await getOwnedProfile(auth, profileId);
  const store = await db.store.findUnique({ where: { profileId } });
  return store ? toStoreDTO(store) : null;
}

export async function getOwnedStore(auth: AuthContext, storeId: string) {
  const store = await db.store.findUnique({ where: { id: storeId }, include: { profile: { select: { userId: true } } } });
  if (!store) throw notFound("Store");
  if (store.profile.userId !== auth.userId && auth.role !== "SUPER_ADMIN") throw forbidden();
  return store;
}

export async function upsertStore(auth: AuthContext, profileId: string, raw: StoreInput) {
  const { gatewaySecrets: secretsInput, ...rest } = storeInputSchema.parse(raw);
  const input = rest;
  const profile = await getOwnedProfile(auth, profileId);
  const existing = await db.store.findUnique({ where: { profileId } });

  // Country → default currency; gateways must be available in that country and support the currency.
  const country = input.country ?? existing?.country ?? "BD";
  if (input.country && !input.currency && input.country !== existing?.country) input.currency = countryDef(country).currency as CurrencyCode;
  const currency = input.currency ?? existing?.currency ?? countryDef(country).currency;
  if (input.enabledGateways) {
    const allowed = new Set(gatewaysForCountry(country).map((g) => g.key));
    input.enabledGateways = [...new Set(input.enabledGateways)].filter((k) => allowed.has(k));
    for (const key of input.enabledGateways) {
      const def = gatewayDef(key)!;
      if (!gatewaySupportsCurrency(def, currency)) throw badRequest(`${def.name} doesn't support ${currency}. Change the shop currency or disable ${def.name}.`);
    }
    if (input.enabledGateways.length && !existing?.enabledGateways.length) await assertFeature(profile.userId, "onlinePayments");
  }

  let gatewaySecrets: string | undefined;
  if (secretsInput) {
    const merged: GatewaySecrets = { ...(existing ? readStoreSecrets(existing) : {}) };
    for (const [key, fields] of Object.entries(secretsInput) as [keyof GatewaySecrets, Record<string, string>][]) {
      const current = { ...(merged[key] ?? {}) };
      for (const [f, v] of Object.entries(fields ?? {})) if (v !== "") current[f] = v; // empty = keep stored secret
      merged[key] = current;
    }
    gatewaySecrets = encryptJson(merged);
  }

  const data = {
    ...rest,
    country,
    currency,
    logoUrl: rest.logoUrl || null,
    bannerUrl: rest.bannerUrl || null,
    messengerUrl: rest.messengerUrl || null,
    ...(gatewaySecrets ? { gatewaySecrets } : {}),
  } satisfies Prisma.StoreUncheckedUpdateInput;

  const store = existing
    ? await db.store.update({ where: { id: existing.id }, data })
    : await db.store.create({ data: { ...data, profileId, name: input.name } });
  await invalidateProfile(profileId);
  return toStoreDTO(store);
}

// ── Categories ─────────────────────────────────────────────────────────

export async function listCategories(auth: AuthContext, storeId: string) {
  await getOwnedStore(auth, storeId);
  const cats = await db.category.findMany({
    where: { storeId },
    orderBy: { order: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug, order: c.order, imageUrl: c.imageUrl, productCount: c._count.products }));
}

export async function createCategory(auth: AuthContext, storeId: string, name: string, imageUrl?: string | null) {
  const store = await getOwnedStore(auth, storeId);
  const base = slugify(name, 50) || "category";
  let slug = base;
  for (let i = 2; await db.category.findFirst({ where: { storeId, slug } }); i++) slug = `${base}-${i}`;
  const count = await db.category.count({ where: { storeId } });
  const cat = await db.category.create({ data: { storeId, name, slug, order: count, imageUrl: imageUrl || null } });
  invalidate(tags.store(store.profileId));
  return { id: cat.id, name: cat.name, slug: cat.slug, order: cat.order, imageUrl: cat.imageUrl };
}

export async function updateCategory(auth: AuthContext, categoryId: string, input: { name?: string; imageUrl?: string | null }) {
  const cat = await db.category.findUnique({ where: { id: categoryId } });
  if (!cat) throw notFound("Category");
  const store = await getOwnedStore(auth, cat.storeId);
  const updated = await db.category.update({
    where: { id: categoryId },
    data: { name: input.name, imageUrl: input.imageUrl === undefined ? undefined : input.imageUrl || null },
  });
  invalidate(tags.store(store.profileId));
  return { id: updated.id, name: updated.name, slug: updated.slug, order: updated.order, imageUrl: updated.imageUrl };
}

export async function deleteCategory(auth: AuthContext, categoryId: string) {
  const cat = await db.category.findUnique({ where: { id: categoryId } });
  if (!cat) throw notFound("Category");
  const store = await getOwnedStore(auth, cat.storeId);
  await db.category.delete({ where: { id: categoryId } });
  invalidate(tags.store(store.profileId));
  return { id: categoryId };
}

// ── Products ───────────────────────────────────────────────────────────

export async function listProducts(auth: AuthContext, storeId: string, search?: string) {
  await getOwnedStore(auth, storeId);
  const products = await db.product.findMany({
    where: { storeId, ...(search ? { name: { contains: search, mode: "insensitive" } } : {}) },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return products.map(toProductDTO);
}

async function uniqueProductSlug(storeId: string, wanted: string, exceptId?: string) {
  const base = slugify(wanted, 150) || "product";
  let slug = base;
  for (let i = 2; ; i++) {
    const hit = await db.product.findFirst({ where: { storeId, slug, ...(exceptId ? { NOT: { id: exceptId } } : {}) } });
    if (!hit) return slug;
    slug = `${base}-${i}`;
  }
}

function validateProduct(input: ReturnType<typeof productInputSchema.parse>) {
  if (input.type === "AFFILIATE" && !input.affiliateUrl) throw badRequest("Affiliate products need an affiliate URL");
  if (input.comparePrice != null && input.comparePrice > 0 && input.comparePrice < input.price) {
    throw badRequest("Compare-at price must be higher than price");
  }
}

export async function createProduct(auth: AuthContext, storeId: string, raw: ProductInput) {
  const input = productInputSchema.parse(raw);
  validateProduct(input);
  const store = await getOwnedStore(auth, storeId);
  const count = await db.product.count({ where: { storeId } });
  await assertLimit(store.profile.userId, "products", count, "products");
  if (input.categoryId && !(await db.category.findFirst({ where: { id: input.categoryId, storeId } }))) {
    throw badRequest("Category not found");
  }
  const product = await db.product.create({
    data: {
      ...input,
      storeId,
      slug: await uniqueProductSlug(storeId, input.slug || input.name),
      affiliateUrl: input.affiliateUrl || null,
      order: count,
    },
  });
  invalidate(tags.store(store.profileId));
  return toProductDTO(product);
}

async function getOwnedProduct(auth: AuthContext, productId: string) {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw notFound("Product");
  const store = await getOwnedStore(auth, product.storeId);
  return { product, store };
}

export async function updateProduct(auth: AuthContext, productId: string, raw: ProductInput) {
  const { product, store } = await getOwnedProduct(auth, productId);
  const input = productInputSchema.parse(raw);
  validateProduct(input);
  if (input.categoryId && !(await db.category.findFirst({ where: { id: input.categoryId, storeId: product.storeId } }))) {
    throw badRequest("Category not found");
  }
  const updated = await db.product.update({
    where: { id: productId },
    data: {
      ...input,
      slug: input.slug && input.slug !== product.slug ? await uniqueProductSlug(product.storeId, input.slug, productId) : undefined,
      affiliateUrl: input.affiliateUrl || null,
    },
  });
  invalidate(tags.store(store.profileId));
  await invalidateProfile(store.profileId);
  return toProductDTO(updated);
}

export async function deleteProduct(auth: AuthContext, productId: string) {
  const { store } = await getOwnedProduct(auth, productId);
  await db.product.delete({ where: { id: productId } });
  invalidate(tags.store(store.profileId));
  await invalidateProfile(store.profileId);
  return { id: productId };
}
