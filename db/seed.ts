import { existsSync } from "fs"

// Load .env file
if (existsSync(".env")) {
  try {
    process.loadEnvFile()
  } catch (e) {
    // Fallback for older node versions or environments where loadEnvFile fails
    console.warn(
      "Could not load .env file using process.loadEnvFile(). Ensure you are using Node 20.12+ or run via 'npm run db:seed'."
    )
  }
}

import { db } from "./index"
import {
  plans,
  settings,
  templates,
  featureCategories,
  features,
  planFeatures,
} from "./schema"
import { eq } from "drizzle-orm"

async function main() {
  console.log("Seeding feature categories...")
  const categoriesData = [
    { name: "Essential Widgets", slug: "essential-widgets", position: 1 },
    {
      name: "Premium Conversion Widgets",
      slug: "premium-widgets",
      position: 2,
    },
    { name: "Core Store Sections", slug: "core-sections", position: 3 },
    {
      name: "High-Conversion Sections",
      slug: "conversion-sections",
      position: 4,
    },
  ]

  const categoryIds: Record<string, string> = {}
  for (const cat of categoriesData) {
    const [existing] = await db
      .select()
      .from(featureCategories)
      .where(eq(featureCategories.slug, cat.slug))
      .limit(1)
    if (existing) {
      categoryIds[cat.slug] = existing.id
    } else {
      const [inserted] = await db
        .insert(featureCategories)
        .values(cat)
        .returning({ id: featureCategories.id })
      categoryIds[cat.slug] = inserted.id
    }
  }

  console.log("Seeding features...")
  const featuresData = [
    // Essential Widgets
    {
      category: "essential-widgets",
      name: "Add To Cart Button",
      slug: "atc-button",
      position: 1,
    },
    {
      category: "essential-widgets",
      name: "Product Price",
      slug: "product-price",
      position: 2,
    },
    {
      category: "essential-widgets",
      name: "Column & Product Container",
      slug: "product-container",
      position: 3,
    },
    // Premium Widgets
    {
      category: "premium-widgets",
      name: "Countdown Timer & Urgency",
      slug: "countdown-timer",
      position: 1,
      isHighlight: true,
    },
    {
      category: "premium-widgets",
      name: "Product Bundle Offer",
      slug: "bundle-offer",
      position: 2,
      isHighlight: true,
    },
    {
      category: "premium-widgets",
      name: "Sticky Add To Cart",
      slug: "sticky-atc",
      position: 3,
      isHighlight: true,
    },
    // Core Sections
    {
      category: "core-sections",
      name: "Announcement Bar & Header",
      slug: "header",
      position: 1,
    },
    {
      category: "core-sections",
      name: "Collection Product Grid",
      slug: "product-grid",
      position: 2,
    },
    // Conversion Sections
    {
      category: "conversion-sections",
      name: "Comparison Table & Slider",
      slug: "comparison-table",
      position: 1,
      isHighlight: true,
    },
    {
      category: "conversion-sections",
      name: "Instagram Feed & TikTok",
      slug: "social-feed",
      position: 2,
    },
  ]

  const featureIds: Record<string, string> = {}
  for (const feat of featuresData) {
    const [existing] = await db
      .select()
      .from(features)
      .where(eq(features.slug, feat.slug))
      .limit(1)
    const data = {
      name: feat.name,
      slug: feat.slug,
      categoryId: categoryIds[feat.category],
      position: feat.position,
      isHighlight: feat.isHighlight || false,
    }
    if (existing) {
      featureIds[feat.slug] = existing.id
      await db.update(features).set(data).where(eq(features.id, existing.id))
    } else {
      const [inserted] = await db
        .insert(features)
        .values(data)
        .returning({ id: features.id })
      featureIds[feat.slug] = inserted.id
    }
  }

  console.log("Seeding plans...")
  const planData = [
    {
      name: "Free",
      mode: "free" as const,
      slots: 1,
      regularPrice: 0,
      finalPrice: 0,
      currency: "usd",
      stripePaymentLink: null,
      features: [
        "4 Industry Templates",
        "1 Store License Slot",
        "20 Advanced Features",
        "Standard Email Support",
      ],
      position: 1,
    },
    {
      name: "Pro",
      mode: "monthly" as const,
      slots: 1,
      regularPrice: 2900,
      finalPrice: 1900,
      currency: "usd",
      stripePaymentLink: "https://buy.stripe.com/14A14n81z9ATdcX8sgdnW00",
      features: [
        "10 Industry Templates",
        "1 Store License Slot",
        "80+ Advanced Features",
        "Priority Help & Support",
        "Development Support",
      ],
      position: 2,
      hasYearlyPlan: true,
      yearlyDiscountPercentage: 20,
      yearlyDiscountCouponCode: "SAVE20",
      couponCode: "WELCOME20",
      badge: "Most Popular",
      cancelApplyDiscount: true,
      monthlyCancelDiscount: 50,
      yearlyCancelDiscount: 50,
      monthlyCancelCouponCode: "STAY50",
      yearlyCancelCouponCode: "STAY50YEAR",
      monthlyCancelDuration: 3,
      yearlyCancelDuration: 1,
    },
  ]

  const planIds: Record<string, string> = {}
  for (const planItem of planData) {
    const [existing] = await db
      .select()
      .from(plans)
      .where(eq(plans.name, planItem.name))
      .limit(1)
    if (existing) {
      planIds[planItem.name] = existing.id
      await db.update(plans).set(planItem).where(eq(plans.id, existing.id))
    } else {
      const [inserted] = await db
        .insert(plans)
        .values(planItem)
        .returning({ id: plans.id })
      planIds[planItem.name] = inserted.id
    }
  }

  console.log("Mapping features to plans...")
  // Map all features to all plans for this seed demo, but differentiate enabled status
  for (const featSlug of Object.keys(featureIds)) {
    for (const planName of Object.keys(planIds)) {
      const isEssential = [
        "atc-button",
        "product-price",
        "product-container",
        "header",
        "product-grid",
      ].includes(featSlug)
      const isEnabled = isEssential || planName !== "Free"

      await db
        .insert(planFeatures)
        .values({
          planId: planIds[planName],
          featureId: featureIds[featSlug],
          isEnabled,
        })
        .onConflictDoUpdate({
          target: [planFeatures.planId, planFeatures.featureId],
          set: { isEnabled },
        })
    }
  }

  console.log("Seeding templates...")
  const templatesData = [
    {
      title: "Fashion",
      shortDesc: "Conversion-optimized layout for premium apparel stores.",
      description:
        "A sleek and conversion-focused fashion store design, perfect for showcasing apparel, accessories, and modern lifestyle collections with style.",
      img: "/assets/templates/1.webp",
      banner: "/assets/zenvyra-theme.webp",
      logo: "/assets/zenvyra-logo.webp",
      bg: "bg-[#F4F9F4]",
      status: "active" as const,
      previewLink: "https://aaurevia.myshopify.com/",
      downloadLink: "https://license.shoptimity.com/templates/zenvyaara.zip",
      cro: "+24%",
      aov: "+18%",
      rev: "+80%",
      startSize: "5",
      position: 1,
    },
    {
      title: "Pet",
      shortDesc: "Playful and engaging design for pet niche stores.",
      description:
        "A friendly and engaging pet store layout designed to highlight pet products, accessories, and essentials with a clean shopping experience.",
      img: "/assets/templates/2.webp",
      banner: "/assets/pawzone-theme.webp",
      logo: "/assets/pawzone-logo.webp",
      bg: "bg-[#FFF8F2]",
      status: "active" as const,
      previewLink: "https://pawzzone.myshopify.com/",
      downloadLink: "https://license.shoptimity.com/templates/pawzzone.zip",
      cro: "+15%",
      aov: "+10%",
      rev: "+45%",
      startSize: "5",
      position: 2,
    },
    {
      title: "Toy",
      shortDesc: "Colorful and fun interface for kids' products.",
      description:
        "A vibrant and playful toy store design crafted to showcase kids' products, games, and gifts with an engaging and fun shopping interface.",
      img: "/assets/templates/4.webp",
      banner: "/assets/kidzo-theme.webp",
      logo: "/assets/kidzo-logo.webp",
      bg: "bg-[#FFF3F5]",
      status: "active" as const,
      previewLink: "https://kiidzo.myshopify.com/",
      downloadLink: "https://license.shoptimity.com/templates/kiidzo.zip",
      cro: "+20%",
      aov: "+12%",
      rev: "+55%",
      startSize: "4.9",
      position: 3,
    },
    {
      title: "Bag",
      shortDesc: "Elegant product-focused layout for fashion accessories.",
      description:
        "A stylish and product-focused bag store layout ideal for displaying handbags, backpacks, and travel gear with a premium shopping feel.",
      img: "/assets/templates/3.webp",
      banner: "/assets/velmora-theme.webp",
      logo: "/assets/velmora-logo.webp",
      bg: "bg-[#F0F5FD]",
      status: "active" as const,
      previewLink: "https://velmmora.myshopify.com/",
      downloadLink: "https://license.shoptimity.com/templates/velmmora.zip",
      cro: "+22%",
      aov: "+15%",
      rev: "+65%",
      startSize: "5",
      position: 4,
    },
    {
      title: "Gym",
      shortDesc: "High-energy design for activewear and supplements.",
      description:
        "A bold and energetic fitness store design built to showcase gym gear, activewear, and wellness products with high-performance appeal.",
      img: "/assets/templates/5.webp",
      banner: "/assets/fitcore-theme.webp",
      logo: "/assets/fitcore-logo.webp",
      bg: "bg-[#F2FBFB]",
      status: "active" as const,
      previewLink: "https://fittcore.myshopify.com/",
      downloadLink: "https://license.shoptimity.com/templates/fittcore.zip",
      cro: "+28%",
      aov: "+20%",
      rev: "+90%",
      startSize: "5",
      position: 5,
    },
    {
      title: "Pan",
      shortDesc:
        "Elegant Home Decor Experience Designed for Modern Living Spaces",
      description:
        "A clean and product-focused kitchenware store design crafted to showcase pans, cookware, and culinary essentials with a modern and easy shopping experience.",
      img: "/assets/templates/6.webp",
      banner: "/assets/panora-home-theme.webp",
      logo: "/assets/panora-home-logo.webp",
      bg: "bg-[#F9F6F2]",
      status: "active" as const,
      previewLink: "https://panorahome.myshopify.com/",
      downloadLink: "https://license.shoptimity.com/templates/panorahome.zip",
      cro: "+52%",
      aov: "+9%",
      rev: "+78%",
      startSize: "4.8",
      position: 6,
    },
    {
      title: "Bathroom",
      shortDesc:
        "Clean Aquatic Lifestyle Design Built for Peaceful Living Spaces",
      description:
        "A refreshing and minimal bathroom store layout designed to highlight bath essentials, fittings, and accessories with a calm and premium shopping feel.",
      img: "/assets/templates/7.webp",
      banner: "/assets/aqua-space-theme.webp",
      logo: "/assets/aqua-space-logo.webp",
      bg: "bg-[#F2F8FF]",
      status: "active" as const,
      previewLink: "https://aquaspacee.myshopify.com/",
      downloadLink: "https://license.shoptimity.com/templates/aquaspacee.zip",
      cro: "+55%",
      aov: "+9%",
      rev: "+76%",
      startSize: "4.9",
      position: 7,
    },
    {
      title: "Cake",
      shortDesc: "Elegant Dessert Store Layout for Premium Sweet Experiences",
      description:
        "A delightful and elegant bakery store design perfect for showcasing cakes, desserts, and sweet treats with a visually appealing and smooth shopping experience.",
      img: "/assets/templates/8.webp",
      banner: "/assets/creamelle-theme.webp",
      logo: "/assets/creamelle-logo.webp",
      bg: "bg-[#FFF6F8]",
      status: "active" as const,
      previewLink: "https://creamelle.myshopify.com/",
      downloadLink: "https://license.shoptimity.com/templates/creamelle.zip",
      cro: "+46%",
      aov: "+11%",
      rev: "+72%",
      startSize: "5",
      position: 8,
    },
    {
      title: "Glasses",
      shortDesc:
        "Minimal Eyewear Store Design Focused on Clean Visual Shopping",
      description:
        "A sleek and modern eyewear store layout built to showcase glasses, sunglasses, and accessories with clarity, style, and a premium shopping interface.",
      img: "/assets/templates/9.webp",
      banner: "/assets/glassie-web.webp",
      logo: "/assets/glassie-logo.webp",
      bg: "bg-[#e8f1e9]",
      status: "active" as const,
      previewLink: "https://glasssie.myshopify.com/",
      downloadLink: "https://license.shoptimity.com/templates/glasssie.zip",
      cro: "+57%",
      aov: "+7%",
      rev: "+74%",
      startSize: "4.7",
      position: 9,
    },
    {
      title: "Speaker",
      shortDesc: "Immersive tech and audio store interface.",
      description:
        "A bold and immersive audio store design crafted to highlight speakers, sound systems, and tech accessories with a dynamic and high-performance feel.",
      img: "/assets/templates/10.webp",
      banner: "/assets/audify-theme.webp",
      logo: "/assets/audify-logo.webp",
      bg: "bg-[#F3F3F7]",
      status: "active" as const,
      previewLink: "https://auddify.myshopify.com/",
      downloadLink: "https://license.shoptimity.com/templates/auddify.zip",
      cro: "+63%",
      aov: "+14%",
      rev: "+88%",
      startSize: "5",
      position: 10,
    },
  ]

  for (const template of templatesData) {
    const [existing] = await db
      .select()
      .from(templates)
      .where(eq(templates.title, template.title))
      .limit(1)
    if (existing) {
      await db
        .update(templates)
        .set(template)
        .where(eq(templates.id, existing.id))
    } else {
      await db.insert(templates).values(template)
    }
  }

  console.log("Seeding system settings...")
  const defaultSettings = {
    key: "general_settings",
    value: {
      coupon_code: "WELCOME5",
      discount_percent: 5,
      enable_discount: true,
      cancel_offer_timeout: 300,
    },
  }

  const [existingSettings] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, defaultSettings.key))
    .limit(1)

  if (!existingSettings) {
    await db.insert(settings).values(defaultSettings as any)
  }

  console.log("Seeding complete.")
  process.exit(0)
}

main().catch((err) => {
  console.error("Seeding failed:", err)
  process.exit(1)
})
