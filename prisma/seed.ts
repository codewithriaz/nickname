/**
 * Seed: plans, templates, platform settings, super admin and a demo seller.
 * Idempotent — safe to run many times (`pnpm db:seed`).
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEFAULT_PLANS } from "../src/config/plans";
import { TEMPLATE_PRESETS } from "../src/config/templates";
import { DEFAULT_PLATFORM_SETTINGS } from "../src/schemas/admin";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const code = () => Math.random().toString(36).slice(2, 10).toUpperCase();

async function main() {
  for (const plan of DEFAULT_PLANS) {
    await db.plan.upsert({ where: { slug: plan.slug }, create: plan, update: {} });
  }
  console.log(`✔ plans (${DEFAULT_PLANS.length})`);

  for (const t of TEMPLATE_PRESETS) {
    await db.template.upsert({ where: { slug: t.slug }, create: t, update: { theme: t.theme, name: t.name, description: t.description } });
  }
  console.log(`✔ templates (${TEMPLATE_PRESETS.length})`);

  await db.platformSetting.upsert({ where: { key: "platform" }, create: { key: "platform", value: DEFAULT_PLATFORM_SETTINGS }, update: {} });
  console.log("✔ platform settings");

  const adminEmail = (process.env.SUPER_ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || "ChangeMe123!";
  await db.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: "Super Admin",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "SUPER_ADMIN",
      emailVerified: true,
      referralCode: code(),
    },
    update: { role: "SUPER_ADMIN" },
  });
  console.log(`✔ super admin: ${adminEmail}`);

  // ── Demo seller ────────────────────────────────────────────────────
  const demoEmail = "demo@nickname.app";
  const existingDemo = await db.user.findUnique({ where: { email: demoEmail } });
  if (!existingDemo) {
    const bazaar = await db.template.findUnique({ where: { slug: "bazaar" } });
    const demo = await db.user.create({
      data: {
        email: demoEmail,
        name: "Demo Seller",
        passwordHash: await bcrypt.hash("Demo12345", 12),
        emailVerified: true,
        referralCode: code(),
      },
    });
    const profile = await db.profile.create({
      data: {
        userId: demo.id,
        username: "demo",
        displayName: "Rangdhanu Fashion",
        bio: "হাতে বানানো শাড়ি, থ্রি-পিস ও গহনা 🌸 সারা বাংলাদেশে ক্যাশ অন ডেলিভারি",
        templateId: bazaar?.id,
        socials: [
          { platform: "facebook", url: "https://facebook.com/" },
          { platform: "instagram", url: "https://instagram.com/" },
          { platform: "whatsapp", url: "https://wa.me/8801700000000" },
        ],
        settings: { showShare: true, showSearch: false, hideBranding: false, sensitive: false, socialsPosition: "top" },
        verification: "APPROVED",
      },
    });
    const store = await db.store.create({
      data: {
        profileId: profile.id,
        name: "Rangdhanu Fashion",
        description: "Handmade sarees, three-pieces & jewellery.",
        phone: "01700000000",
        whatsapp: "8801700000000",
        codEnabled: true,
        manualEnabled: true,
        manualAccounts: { bkash: "01700000000", nagad: "01700000000", instructions: "Send Money করে TrxID দিন" },
        orderPrefix: "RF",
      },
    });
    const cat = await db.category.create({ data: { storeId: store.id, name: "Saree", slug: "saree" } });
    const products = [
      { name: "Jamdani Saree — Red", price: 350000, comparePrice: 420000, stock: 12 },
      { name: "Cotton Three-Piece", price: 180000, comparePrice: null, stock: 25 },
      { name: "Oxidised Jhumka Earrings", price: 45000, comparePrice: 60000, stock: 40 },
      { name: "Handloom Gamchha (2 pcs)", price: 35000, comparePrice: null, stock: null },
    ];
    for (const [i, p] of products.entries()) {
      await db.product.create({
        data: {
          storeId: store.id,
          categoryId: i === 0 ? cat.id : null,
          name: p.name,
          slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          description: "Premium quality, carefully packed and delivered across Bangladesh.",
          price: p.price,
          comparePrice: p.comparePrice,
          stock: p.stock,
          images: [],
          options: i === 1 ? [{ name: "Size", values: ["M", "L", "XL"] }] : [],
          isFeatured: i === 0,
          order: i,
        },
      });
    }
    await db.block.createMany({
      data: [
        { profileId: profile.id, type: "SOCIALS", order: 0, data: { size: "md" } },
        { profileId: profile.id, type: "LINK", title: "🛍️ Shop all products", url: "/demo/shop", order: 1, animation: "PULSE", layout: "HIGHLIGHT" },
        { profileId: profile.id, type: "HEADER", title: "New arrivals", order: 2 },
        {
          profileId: profile.id,
          type: "LINK",
          title: "Order on WhatsApp",
          url: "https://wa.me/8801700000000",
          order: 3,
          thumbnail: { kind: "emoji", value: "💬" },
        },
        {
          profileId: profile.id,
          type: "AFFILIATE",
          title: "My favourite ring light",
          url: "https://example.com/ring-light",
          order: 4,
          data: { disclosure: "Affiliate link", couponCode: "DEMO10" },
        },
        {
          profileId: profile.id,
          type: "EMAIL_SIGNUP",
          title: "Get offers first",
          order: 5,
          data: { description: "New collection & discount alerts", buttonLabel: "Subscribe", collectName: false, collectPhone: true, successMessage: "ধন্যবাদ!" },
        },
      ],
    });
    console.log("✔ demo seller: demo@nickname.app / Demo12345 → /demo");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
