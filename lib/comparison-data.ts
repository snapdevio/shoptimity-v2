export interface ComparisonFeature {
  name: string
  shoptimity: boolean | string
  competitor: boolean | string
  description?: string
  category?: string
}

export interface CompetitorData {
  name: string
  logo: string
  description: string
  heroHeadline: string
  heroSubheadline: string
  heroImage: string
  features: ComparisonFeature[]
  pros: string[]
  cons: string[]
  featureCards: {
    title: string
    description: string
    imageSrc: string
  }[]
}

export const comparisonData: Record<string, CompetitorData> = {
  booster: {
    name: "Booster",
    logo: "/shoptimity-icon.png",
    description:
      "Booster Theme is known for aggressive sales tactics. Shoptimity offers a refined alternative, prioritizing brand trust and long-term customer relationships over high-pressure design.",
    heroHeadline: "Why Premium Brands Prefer Shoptimity Over Booster",
    heroSubheadline:
      "Build trust and drive sales without the aggressive, spammy widgets. Shoptimity delivers elegant conversions.",
    heroImage:
      "https://license.shoptimity.com/assets/comparisons/booster-x-shoptimity.webp",
    features: [
      {
        category: "BRANDING & TRUST",
        name: "Customer Experience",
        shoptimity: "Trust-Building",
        competitor: "Aggressive Urgency",
        description:
          "Shoptimity focuses on elegant persuasion, avoiding the fake scarcity tactics that damage brand reputation.",
      },
      {
        category: "CONVERSION & APPS",
        name: "Sales Features",
        shoptimity: "Native & Refined",
        competitor: "Cluttered Interface",
        description:
          "Enjoy powerful conversion tools that seamlessly match your store's aesthetic.",
      },
      {
        category: "PERFORMANCE & SUPPORT",
        name: "Page Speed",
        shoptimity: "Optimized Architecture",
        competitor: "Plugin Heavy",
        description:
          "Say goodbye to bloated code. Shoptimity is meticulously crafted for extremely fast load times.",
      },
      {
        category: "TEMPLATES & DESIGN",
        name: "Visual Builder",
        shoptimity: "Intuitive Drag & Drop",
        competitor: "Complex Settings",
        description:
          "Configure your store effortlessly with our highly intuitive theme settings panel.",
      },
    ],
    pros: [
      "Elegant, trust-building design",
      "Lightning-fast performance",
      "Intuitive and easy setup",
      "Refined conversion tools",
    ],
    cons: [
      "Aggressive sales tactics hurt brand image",
      "Cluttered competitor interface",
      "Heavier reliance on scripting",
    ],
    featureCards: [
      {
        title: "Trust Drives Higher Conversions",
        description:
          "Modern consumers are blind to fake countdown timers. Shoptimity uses genuine trust signals and elegant design to convert visitors into lifelong customers.",
        imageSrc:
          "https://license.shoptimity.com/assets/comparisons/booster-x-shoptimity-1.webp",
      },
      {
        title: "Speed is a Feature",
        description:
          "Don't let a bloated theme cost you sales. Shoptimity's performance-focused approach ensures your pages load instantly, minimizing bounce rates and maximizing revenue.",
        imageSrc:
          "https://license.shoptimity.com/assets/comparisons/booster-x-shoptimity-2.webp",
      },
    ],
  },
  shrine: {
    name: "Shrine",
    logo: "/shoptimity-icon.png", // Placeholder or real logo
    description:
      "Shrine is a performance-focused Shopify theme. While fast, it often requires tiered payments for advanced features and lacks Shoptimity's niche-specific layouts.",
    heroHeadline: "Why Brand Owners are Switching from Shrine to Shoptimity",
    heroSubheadline:
      "Stop paying for 'Pro' features. Shoptimity gives you everything you need to scale for a single one-time payment.",
    heroImage:
      "https://license.shoptimity.com/assets/comparisons/shrine-x-shoptimity.webp",
    features: [
      {
        category: "PRICING & VALUE",
        name: "Pricing Model",
        shoptimity: "One-time Payment",
        competitor: "Tiered (Standard/Pro)",
        description:
          "Shoptimity includes all features in one price, whereas Shrine locks key features behind tiers.",
      },
      {
        category: "PRICING & VALUE",
        name: "Hidden Fees",
        shoptimity: "$0 (None)",
        competitor: "$10+ (Monthly Apps)",
        description:
          "Shoptimity replaces 20+ monthly apps; Shrine stores often need extra apps for full functionality.",
      },
      {
        category: "TEMPLATES & DESIGN",
        name: "Niche Templates",
        shoptimity: "10+ Industry-Specific",
        competitor: "Limited / Generic",
        description:
          "Shoptimity provides layouts custom-built for fashion, beauty, home, and more.",
      },
      {
        category: "CONVERSION & APPS",
        name: "Built-in Upsells",
        shoptimity: true,
        competitor: "Lite Tier Only",
        description:
          "Advanced quantity breaks and cart upsells are standard in Shoptimity.",
      },
      {
        category: "CONVERSION & APPS",
        name: "Advertorial Support",
        shoptimity: "Native Builders",
        competitor: "Not Supported",
        description:
          "Shoptimity is the first theme with native advertorial pre-linker support.",
      },
      {
        category: "PERFORMANCE & SUPPORT",
        name: "Mobile Optimization",
        shoptimity: "Mobile-First UX",
        competitor: "Standard Responsive",
        description:
          "Every pixel of Shoptimity is tested for the highest mobile conversion.",
      },
    ],
    pros: [
      "No recurring monthly fees",
      "Superior mobile conversion rate",
      "All templates included for free",
      "Native advertorial builders",
    ],
    cons: [
      "Key features locked behind 'Pro' tier",
      "Less diversity in niche designs",
      "Requires extra app subscriptions",
    ],
    featureCards: [
      {
        title: "Performance That Doesn't Cut Corners",
        description:
          "While Shrine focuses on minimalism, Shoptimity focuses on Conversion. We don't just make your site fast; we make it sell. Our one-time payment includes advanced features that Shrine locks behind their 'Pro' tier.",
        imageSrc:
          "https://license.shoptimity.com/assets/comparisons/shrine-x-shoptimity-1.webp",
      },
      {
        title: "15+ Industry-Specific Blueprints",
        description:
          "Don't start with a blank canvas. Whether you're in Fashion, Beauty, or Home Decor, we have a scientifically-tested blueprint ready for you to launch in minutes.",
        imageSrc:
          "https://license.shoptimity.com/assets/comparisons/shrine-x-shoptimity-2.webp",
      },
    ],
  },
  glozin: {
    name: "Glozin",
    logo: "/shoptimity-icon.png",
    description:
      "Glozin is a multipurpose Shopify theme. Its vast complexity often leads to a steep learning curve and slower setup compared to Shoptimity.",
    heroHeadline: "Shoptimity vs Glozin: The Best Multi-Purpose Solution?",
    heroSubheadline:
      "Don't get lost in infinite settings. Shoptimity provides a streamlined, high-performance experience designed for high-growth brands.",
    heroImage:
      "https://license.shoptimity.com/assets/comparisons/glozin-x-shoptimity.webp",
    features: [
      {
        category: "CORE FEATURES",
        name: "Theme Ecosystem",
        shoptimity: "All-In-One",
        competitor: "Multipurpose",
        description:
          "Shoptimity provides a complete toolkit tailored for e-commerce growth, while Glozin offers a broad multipurpose approach.",
      },
      {
        category: "TEMPLATES & DESIGN",
        name: "Setup Speed",
        shoptimity: "Fast (1-Click Demos)",
        competitor: "Complex (Steep Curve)",
        description:
          "Shoptimity's pre-built niche templates get you live in hours, not days.",
      },
      {
        category: "CONVERSION & APPS",
        name: "AOV Boosting Tools",
        shoptimity: "20+ Built-in Tools",
        competitor: "Standard Elements",
        description:
          "Everything from sticky charts to countdowns is included and tested for speed.",
      },
      {
        category: "PERFORMANCE & SUPPORT",
        name: "Mobile Speed Score",
        shoptimity: "98/100 (Avg)",
        competitor: "Varies (Bloated JS)",
        description:
          "Glozin's multipurpose nature can lead to slower mobile performance.",
      },
      {
        category: "PERFORMANCE & SUPPORT",
        name: "Updates & Community",
        shoptimity: "Lifetime Updates",
        competitor: "Standard Support",
        description: "Access our active community of 1,000+ brand owners.",
      },
    ],
    pros: [
      "Faster time-to-market",
      "Conversion-first architecture",
      "Pre-tested industry designs",
      "Better mobile performance",
    ],
    cons: [
      "Overwhelming configuration options",
      "Higher learning curve for users",
      "Potential performance bloat",
    ],
    featureCards: [
      {
        title: "Designed for Brand Owners, Not Just Developers",
        description:
          "Glozin's multipurpose nature often means spending days in complex settings. Shoptimity is built for speed — both site speed and setup speed. We give you the high-growth blocks you need without the bloat.",
        imageSrc:
          "https://license.shoptimity.com/assets/comparisons/glozin-x-shoptimity-1.webp",
      },
      {
        title: "Maximize Conversion with Built-in AOV Services",
        description:
          "Eliminate the need for clunky third-party plugins. Shoptimity includes essential high-converting features out-of-the-box like intelligent upsells, quantity breaks, and integrated social proof, ensuring they work together perfectly to elevate your brand.",
        imageSrc:
          "https://license.shoptimity.com/assets/comparisons/glozin-x-shoptimity-2.webp",
      },
    ],
  },
  ecomelevate: {
    name: "Ecomelevate",
    logo: "/shoptimity-icon.png",
    description:
      "While Ecomelevate offers e-commerce solutions, Shoptimity provides a more robust, fully integrated suite of tools specifically engineered for rapid scaling.",
    heroHeadline: "Scale Faster with Shoptimity vs Ecomelevate",
    heroSubheadline:
      "Don't settle for basic functionality. Upgrade to a theme that actively works to increase your average order value and customer retention.",
    heroImage:
      "https://license.shoptimity.com/assets/comparisons/shoptimity-x-elevate.webp",
    features: [
      {
        category: "CORE FEATURES",
        name: "Native Upsells",
        shoptimity: "Advanced & Integrated",
        competitor: "Basic Options",
        description:
          "Shoptimity features intelligent, dynamic cart upsells that significantly boost revenue.",
      },
      {
        category: "TEMPLATES & DESIGN",
        name: "Design Flexibility",
        shoptimity: "Highly Modular",
        competitor: "Restricted Layouts",
        description:
          "Customize every pixel with Shoptimity's deep customization settings.",
      },
      {
        category: "CONVERSION & APPS",
        name: "AOV Boosting Tools",
        shoptimity: "20+ Built-in Tools",
        competitor: "Standard Elements",
        description:
          "Everything from sticky charts to countdowns is included and tested for speed.",
      },
      {
        category: "PERFORMANCE & SUPPORT",
        name: "Mobile Speed Score",
        shoptimity: "98/100 (Avg)",
        competitor: "Varies (Bloated JS)",
        description:
          "Ecomelevate's multipurpose nature can lead to slower mobile performance.",
      },
      {
        category: "PERFORMANCE & SUPPORT",
        name: "Developer Resources",
        shoptimity: "Extensive Documentation",
        competitor: "Standard Docs",
        description:
          "Empower your team with comprehensive guides, videos, and a thriving community.",
      },
    ],
    pros: [
      "Deeply integrated AOV boosters",
      "Modular design for unique storefronts",
      "Speed that converts",
      "Comprehensive resources and support",
    ],
    cons: [
      "Competitor requires third-party apps for basic logic",
      "Less flexible design structure",
      "Basic upselling capabilities",
    ],
    featureCards: [
      {
        title: "Elevate Your Average Order Value",
        description:
          "Shoptimity goes beyond standard layouts by embedding data-driven upselling and cross-selling mechanics directly into the cart and product pages.",
        imageSrc:
          "https://license.shoptimity.com/assets/comparisons/shoptimity-x-elevate-1.webp",
      },
      {
        title: "Unmatched Customization",
        description:
          "Break free from restrictive templates. Shoptimity's modular blocks allow you to craft a completely unique customer journey without touching a single line of code.",
        imageSrc:
          "https://license.shoptimity.com/assets/comparisons/shoptimity-x-elevate-2.webp",
      },
    ],
  },
  prestige: {
    name: "Prestige",
    logo: "/shoptimity-icon.png",
    description:
      "While Prestige is a beautiful aesthetic theme, it lacks the native conversion-boosting tools and direct-response features built right into Shoptimity.",
    heroHeadline: "Shoptimity vs Prestige: Beauty Meets Performance",
    heroSubheadline:
      "Get the high-end look of Prestige combined with the aggressive conversion power needed to profitably scale your brand.",
    heroImage:
      "https://license.shoptimity.com/assets/comparisons/shoptimity-x-prestige.webp",
    features: [
      {
        category: "CONVERSION & APPS",
        name: "Built-in Upsells",
        shoptimity: "Native Cart & Post-Purchase",
        competitor: "Requires Apps",
        description:
          "Prestige requires expensive third-party apps for upselling, whereas Shoptimity has them built-in.",
      },
      {
        category: "CORE FEATURES",
        name: "Advertorial Capabilities",
        shoptimity: "Native Support",
        competitor: "Not Supported",
        description:
          "Bridge the gap between ads and products with Shoptimity's built-in advertorial templates.",
      },
      {
        category: "TEMPLATES & DESIGN",
        name: "Design Capability",
        shoptimity: "Luxury & High-Converting",
        competitor: "Luxury Focus Only",
        description:
          "Shoptimity matches the high-end aesthetic of Prestige while adding robust sales mechanics.",
      },
      {
        category: "PERFORMANCE & SUPPORT",
        name: "Mobile Conversion",
        shoptimity: "Conversion-First UX",
        competitor: "Standard Responsive",
        description:
          "Shoptimity is designed strictly mobile-first to capture the modern shopping audience.",
      },
    ],
    pros: [
      "Maintains premium brand aesthetics",
      "Native upselling and cart tools included",
      "Built-in advertorial templates",
      "Mobile-first conversion design",
    ],
    cons: [
      "Competitor requires apps for basic conversions",
      "Prestige lacks built-in direct response features",
      "Slower iteration for landing pages",
    ],
    featureCards: [
      {
        title: "Stop Settling for Just a Pretty Store",
        description:
          "Aesthetic is important, but conversion pays the bills. Shoptimity gives you the best of both worlds: a luxury brand feel with the underlying mechanics of a direct-response powerhouse.",
        imageSrc:
          "https://license.shoptimity.com/assets/comparisons/shoptimity-x-prestige-1.webp",
      },
      {
        title: "All-in-One Growth Toolkit",
        description:
          "Why pay monthly for apps when it's built into your theme? From quantity breaks to advanced cart upsells, Shoptimity provides everything needed to increase your AOV right out of the box.",
        imageSrc:
          "https://license.shoptimity.com/assets/comparisons/shoptimity-x-prestige-2.webp",
      },
    ],
  },
  shoptimized: {
    name: "Shoptimized",
    logo: "/shoptimity-icon.png",
    description:
      "Shoptimized is a conversion-focused theme, but its design can often feel rigid and outdated compared to Shoptimity's flexible, modern architecture.",
    heroHeadline: "Upgrade from Shoptimized to a Premium Brand Experience",
    heroSubheadline:
      "Achieve high conversion rates without sacrificing your brand's aesthetic. Shoptimity delivers performance and beauty natively.",
    heroImage:
      "https://license.shoptimity.com/assets/comparisons/shoptimity-x-shoptimized.webp",
    features: [
      {
        category: "DESIGN & CUSTOMIZATION",
        name: "Brand Aesthetics",
        shoptimity: "Premium & Custom",
        competitor: "Template-Driven",
        description:
          "Shoptimity enables luxury and high-converting designs, preventing the 'cookie-cutter' dropshipping look.",
      },
      {
        category: "CONVERSION & APPS",
        name: "AOV Tools Integration",
        shoptimity: "Seamlessly Blended",
        competitor: "Often Cluttered",
        description:
          "Shoptimity integrates conversion boosters natively without making your store look spammy.",
      },
      {
        category: "PERFORMANCE & SUPPORT",
        name: "Code Architecture",
        shoptimity: "Modern Next-Gen",
        competitor: "Legacy Stack",
        description:
          "Shoptimity is built with the latest technologies for lightning-fast load times.",
      },
      {
        category: "TEMPLATES & DESIGN",
        name: "Niche Layouts",
        shoptimity: "Industry Specific",
        competitor: "General Purpose",
        description:
          "Launch faster with layouts customized for your specific industry out of the box.",
      },
    ],
    pros: [
      "Modern, premium design language",
      "Seamless and clean conversion tools",
      "Faster, lightweight code base",
      "Industry-specific templates included",
    ],
    cons: [
      "Rigid design options in Shoptimized",
      "Can look like a generic store",
      "Heavier codebase affecting speed",
    ],
    featureCards: [
      {
        title: "Conversion Without the Clutter",
        description:
          "Shoptimity proves you don't need a cluttered site to convert. Our native upselling and cross-selling tools are elegantly integrated to boost AOV while maintaining a luxury brand feel.",
        imageSrc:
          "https://license.shoptimity.com/assets/comparisons/shoptimity-x-shoptimized-1.webp",
      },
      {
        title: "Built on Modern Foundations",
        description:
          "Leave legacy code behind. Shoptimity uses the most up-to-date web standards to ensure your site is blazing fast, providing a flawless experience on both desktop and mobile.",
        imageSrc:
          "https://license.shoptimity.com/assets/comparisons/shoptimity-x-shoptimized-2.webp",
      },
    ],
  },
}
