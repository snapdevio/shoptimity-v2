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
    { name: "Theme Widgets", slug: "widgets", position: 1 },
    { name: "Cart Widgets", slug: "cart-widgets", position: 2 },
    { name: "Theme Sections", slug: "sections", position: 3 },
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
    {
      category: "widgets",
      name: "Promo Pop-Up",
      slug: "promo-pop-up",
      position: 1,
      isHighlight: true,
    },
    {
      category: "cart-widgets",
      name: "Discount field",
      slug: "discount-field",
      position: 2,
    },
    {
      category: "cart-widgets",
      name: "Payment badges",
      slug: "payment-badges-cart",
      position: 3,
    },
    {
      category: "sections",
      name: "Blog posts",
      slug: "blog-posts",
      position: 4,
    },
    {
      category: "sections",
      name: "Collection list",
      slug: "collection-list",
      position: 5,
    },
    {
      category: "sections",
      name: "Contact form",
      slug: "contact-form",
      position: 6,
    },
    {
      category: "sections",
      name: "Featured collection",
      slug: "featured-collection",
      position: 7,
    },
    {
      category: "sections",
      name: "Rich text",
      slug: "rich-text",
      position: 8,
    },
    {
      category: "sections",
      name: "Slideshow",
      slug: "slideshow",
      position: 9,
    },
    {
      category: "sections",
      name: "Video",
      slug: "video",
      position: 10,
    },
    {
      category: "widgets",
      name: "Award Badge",
      slug: "award-badge",
      position: 11,
    },
    {
      category: "widgets",
      name: "Bundle offer",
      slug: "bundle-offer",
      position: 12,
      isHighlight: true,
    },
    {
      category: "widgets",
      name: "Certification Highlight",
      slug: "certification-highlight",
      position: 13,
    },
    {
      category: "widgets",
      name: "Clickable discount",
      slug: "clickable-discount",
      position: 14,
    },
    {
      category: "widgets",
      name: "Collapsible row",
      slug: "collapsible-row",
      position: 15,
    },
    {
      category: "widgets",
      name: "Complementary products",
      slug: "complementary-products",
      position: 16,
    },
    {
      category: "widgets",
      name: "Content tabs",
      slug: "content-tabs",
      position: 17,
    },
    {
      category: "widgets",
      name: "Custom product field",
      slug: "custom-product-field",
      position: 18,
    },
    {
      category: "widgets",
      name: "Eligibility Notice",
      slug: "eligibility-notice",
      position: 19,
    },
    {
      category: "widgets",
      name: "Emoji benefits",
      slug: "emoji-benefits",
      position: 20,
    },
    {
      category: "widgets",
      name: "Estimated shipping",
      slug: "estimated-shipping",
      position: 21,
    },
    {
      category: "widgets",
      name: "Feature Highlight Banner",
      slug: "feature-highlight-banner",
      position: 22,
    },
    {
      category: "widgets",
      name: "Gifts on quantity",
      slug: "gifts-on-quantity",
      position: 23,
    },
    {
      category: "widgets",
      name: "Icon with content",
      slug: "icon-with-content",
      position: 24,
    },
    {
      category: "widgets",
      name: "Icons with text",
      slug: "icons-with-text",
      position: 25,
    },
    {
      category: "widgets",
      name: "Inventory status",
      slug: "inventory-status",
      position: 26,
      isHighlight: true,
    },
    {
      category: "widgets",
      name: "JSON (Lottie) Animation",
      slug: "json-lottie-animation",
      position: 27,
    },
    {
      category: "widgets",
      name: "Link button",
      slug: "link-button",
      position: 28,
    },
    { category: "widgets", name: "Mega Menu", slug: "mega-menu", position: 29 },
    {
      category: "widgets",
      name: "Music Player",
      slug: "music-player",
      position: 30,
    },
    {
      category: "widgets",
      name: "Payment badges",
      slug: "payment-badges",
      position: 31,
    },
    {
      category: "widgets",
      name: "Pop-up link",
      slug: "pop-up-link",
      position: 32,
    },
    {
      category: "widgets",
      name: "Pro Add to Cart button",
      slug: "pro-add-to-cart-button",
      position: 33,
    },
    {
      category: "widgets",
      name: "Pro Product ATC",
      slug: "pro-product-atc",
      position: 34,
    },
    {
      category: "widgets",
      name: "Product Countdown timer",
      slug: "product-countdown-timer",
      position: 35,
      isHighlight: true,
    },
    {
      category: "widgets",
      name: "Product Highlight Banner",
      slug: "product-highlight-banner",
      position: 36,
    },
    {
      category: "widgets",
      name: "Product upsells",
      slug: "product-upsells",
      position: 37,
      isHighlight: true,
    },
    {
      category: "widgets",
      name: "Product - Image/Video slider",
      slug: "product-imagevideo-slider",
      position: 38,
    },
    {
      category: "widgets",
      name: "Quick Compare",
      slug: "quick-compare",
      position: 39,
    },
    {
      category: "widgets",
      name: "Rating stars",
      slug: "rating-stars",
      position: 40,
    },
    {
      category: "widgets",
      name: "Review avatars",
      slug: "review-avatars",
      position: 41,
    },
    { category: "widgets", name: "Reviews", slug: "reviews", position: 42 },
    {
      category: "widgets",
      name: "Scroll to Top Button",
      slug: "scroll-to-top-button",
      position: 43,
    },
    {
      category: "widgets",
      name: "Shipping checkpoints",
      slug: "shipping-checkpoints",
      position: 44,
      isHighlight: true,
    },
    {
      category: "widgets",
      name: "Sizing chart",
      slug: "sizing-chart",
      position: 45,
    },
    { category: "widgets", name: "Slider", slug: "slider", position: 46 },
    {
      category: "widgets",
      name: "Sticky Add To Cart",
      slug: "sticky-atc",
      position: 47,
      isHighlight: true,
    },
    {
      category: "widgets",
      name: "Subscription widget",
      slug: "subscription-widget",
      position: 48,
    },
    {
      category: "widgets",
      name: "Text with icon",
      slug: "text-with-icon",
      position: 49,
    },
    {
      category: "widgets",
      name: "Track order",
      slug: "track-order",
      position: 50,
    },
    {
      category: "widgets",
      name: "Trustpilot stars",
      slug: "trustpilot-stars",
      position: 51,
    },
    {
      category: "widgets",
      name: "Upsells & Gifts",
      slug: "upsells-gifts",
      position: 52,
      isHighlight: true,
    },
    {
      category: "widgets",
      name: "Urgency text",
      slug: "urgency-text",
      position: 53,
      isHighlight: true,
    },
    {
      category: "widgets",
      name: "Variant picker",
      slug: "variant-picker",
      position: 54,
    },
    { category: "widgets", name: "Wishlist", slug: "wishlist", position: 55 },
    {
      category: "cart-widgets",
      name: "Checkpoints bar",
      slug: "checkpoints-bar",
      position: 56,
    },
    {
      category: "cart-widgets",
      name: "Countdown timer",
      slug: "countdown-timer-cart",
      position: 57,
      isHighlight: true,
    },
    {
      category: "cart-widgets",
      name: "Custom Liquid",
      slug: "custom-liquid-cart",
      position: 58,
    },
    {
      category: "cart-widgets",
      name: "Free/Conditional gift",
      slug: "freeconditional-gift",
      position: 59,
      isHighlight: true,
    },
    {
      category: "cart-widgets",
      name: "Icon with text",
      slug: "icon-with-text-cart",
      position: 60,
    },
    {
      category: "cart-widgets",
      name: "Policies checkbox",
      slug: "policies-checkbox",
      position: 61,
    },
    {
      category: "cart-widgets",
      name: "Product upsells",
      slug: "product-upsells-cart",
      position: 62,
    },
    {
      category: "cart-widgets",
      name: "Progress bar",
      slug: "progress-bar",
      position: 63,
      isHighlight: true,
    },
    {
      category: "cart-widgets",
      name: "Text with icon",
      slug: "text-with-icon-cart",
      position: 64,
    },
    {
      category: "sections",
      name: "3D Parallax hero",
      slug: "3d-parallax-hero",
      position: 65,
    },
    {
      category: "sections",
      name: "Before & After slider",
      slug: "before-after-slider",
      position: 66,
    },
    {
      category: "sections",
      name: "Breadcrumbs",
      slug: "breadcrumbs",
      position: 67,
    },
    {
      category: "sections",
      name: "Bundle deals",
      slug: "bundle-deals",
      position: 68,
      isHighlight: true,
    },
    { category: "sections", name: "Collage", slug: "collage", position: 69 },
    {
      category: "sections",
      name: "Collapsible content",
      slug: "collapsible-content",
      position: 70,
    },
    {
      category: "sections",
      name: "Collection Grid",
      slug: "collection-grid",
      position: 71,
    },
    {
      category: "sections",
      name: "Collection Hover",
      slug: "collection-hover",
      position: 72,
    },
    {
      category: "sections",
      name: "Collection list",
      slug: "collection-list",
      position: 73,
    },
    {
      category: "sections",
      name: "Collection Slider with Content",
      slug: "collection-slider-with-content",
      position: 74,
    },
    {
      category: "sections",
      name: "Collection Tabs",
      slug: "collection-tabs",
      position: 75,
    },
    {
      category: "sections",
      name: "Comparison table",
      slug: "comparison-table",
      position: 76,
      isHighlight: true,
    },
    {
      category: "sections",
      name: "Comparison with Image",
      slug: "comparison-with-image",
      position: 77,
    },
    {
      category: "sections",
      name: "Contact form",
      slug: "contact-form",
      position: 78,
    },
    {
      category: "sections",
      name: "Content tabs",
      slug: "content-tabs-section",
      position: 79,
    },
    {
      category: "sections",
      name: "Content with Image",
      slug: "content-with-image",
      position: 80,
    },
    {
      category: "sections",
      name: "Countdown Banner",
      slug: "countdown-banner",
      position: 81,
    },
    {
      category: "sections",
      name: "Custom Columns V2",
      slug: "custom-columns-v2",
      position: 82,
    },
    {
      category: "sections",
      name: "Custom Liquid",
      slug: "custom-liquid-section",
      position: 83,
    },
    {
      category: "sections",
      name: "Email signup",
      slug: "email-signup",
      position: 84,
    },
    {
      category: "sections",
      name: "Facebook testimonials",
      slug: "facebook-testimonials",
      position: 85,
    },
    {
      category: "sections",
      name: "Featured collection",
      slug: "featured-collection",
      position: 86,
    },
    {
      category: "sections",
      name: "Featured on",
      slug: "featured-on",
      position: 87,
    },
    {
      category: "sections",
      name: "Featured product",
      slug: "featured-product",
      position: 88,
    },
    {
      category: "sections",
      name: "Featured Product Slider",
      slug: "featured-product-slider",
      position: 89,
    },
    {
      category: "sections",
      name: "Hide Header and/or Footer",
      slug: "hide-header-andor-footer",
      position: 90,
    },
    {
      category: "sections",
      name: "Horizontal Ticker",
      slug: "horizontal-ticker",
      position: 91,
    },
    { category: "sections", name: "Icon Bar", slug: "icon-bar", position: 92 },
    {
      category: "sections",
      name: "Icons with content",
      slug: "icons-with-content",
      position: 93,
    },
    {
      category: "sections",
      name: "Image banner",
      slug: "image-banner",
      position: 94,
    },
    {
      category: "sections",
      name: "Image with text",
      slug: "image-with-text",
      position: 95,
    },
    {
      category: "sections",
      name: "Image/Video Slider",
      slug: "imagevideo-slider",
      position: 96,
    },
    {
      category: "sections",
      name: "Inline feed",
      slug: "inline-feed",
      position: 97,
    },
    {
      category: "sections",
      name: "Instagram Feed",
      slug: "instagram-feed",
      position: 98,
    },
    {
      category: "sections",
      name: "Instagram Slider",
      slug: "instagram-slider",
      position: 99,
    },
    {
      category: "sections",
      name: "Instagram stories",
      slug: "instagram-stories",
      position: 100,
    },
    {
      category: "sections",
      name: "Multicolumn",
      slug: "multicolumn",
      position: 101,
    },
    { category: "sections", name: "Multirow", slug: "multirow", position: 102 },
    {
      category: "sections",
      name: "OLD Custom columns",
      slug: "old-custom-columns",
      position: 103,
    },
    { category: "sections", name: "Page", slug: "page", position: 104 },
    {
      category: "sections",
      name: "Parallax Images w/ Text",
      slug: "parallax-images-w-text",
      position: 105,
    },
    {
      category: "sections",
      name: "Pricing table",
      slug: "pricing-table",
      position: 106,
    },
    {
      category: "sections",
      name: "Product features",
      slug: "product-features",
      position: 107,
    },
    {
      category: "sections",
      name: "Product Lifestyle Slider",
      slug: "product-lifestyle-slider",
      position: 108,
    },
    {
      category: "sections",
      name: "Redirect to page",
      slug: "redirect-to-page",
      position: 109,
    },
    { category: "sections", name: "Results", slug: "results", position: 110 },
    {
      category: "sections",
      name: "Review Grid",
      slug: "review-grid",
      position: 111,
    },
    {
      category: "sections",
      name: "Rich text",
      slug: "rich-text",
      position: 112,
    },
    {
      category: "sections",
      name: "Section divider",
      slug: "section-divider",
      position: 113,
    },
    {
      category: "sections",
      name: "Shoppable image",
      slug: "shoppable-image",
      position: 114,
    },
    {
      category: "sections",
      name: "Slider Content Image",
      slug: "slider-content-image",
      position: 115,
    },
    {
      category: "sections",
      name: "Slideshow",
      slug: "slideshow",
      position: 116,
    },
    {
      category: "sections",
      name: "Slideshow hero",
      slug: "slideshow-hero",
      position: 117,
    },
    {
      category: "sections",
      name: "Store colors changer",
      slug: "store-colors-changer",
      position: 118,
    },
    {
      category: "sections",
      name: "Tab Wise Reviews",
      slug: "tab-wise-reviews",
      position: 119,
    },
    {
      category: "sections",
      name: "Testimonials",
      slug: "testimonials",
      position: 120,
    },
    {
      category: "sections",
      name: "TikTok videos",
      slug: "tiktok-videos",
      position: 121,
    },
    { category: "sections", name: "Timeline", slug: "timeline", position: 122 },
    {
      category: "sections",
      name: "Trustpilot reviews",
      slug: "trustpilot-reviews",
      position: 123,
    },
    {
      category: "sections",
      name: "Utility Bar",
      slug: "utility-bar",
      position: 124,
    },
    {
      category: "sections",
      name: "Vertical Ticker",
      slug: "vertical-ticker",
      position: 125,
    },
    { category: "sections", name: "Video", slug: "video", position: 126 },
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
        "10 Advanced Features",
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
        "120 Advanced Features",
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
  const freeFeatureSlugs = [
    "promo-pop-up",
    "discount-field",
    "payment-badges-cart",
    "blog-posts",
    "collection-list",
    "contact-form",
    "featured-collection",
    "rich-text",
    "slideshow",
    "video",
  ]

  for (const featSlug of Object.keys(featureIds)) {
    for (const planName of Object.keys(planIds)) {
      const isEnabled =
        freeFeatureSlugs.includes(featSlug) || planName !== "Free"

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
