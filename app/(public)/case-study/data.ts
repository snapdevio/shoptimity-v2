export interface CaseStudy {
  id: string
  slug: string
  title: string
  client: string
  category: string
  image: string
  summary: string
  challenge: string
  solution: string
  results: string[]
  stats?: { value: string; label: string; color: string }[]
  testimonial: string
  testimonialAuthor: string
}

export const caseStudies: CaseStudy[] = [
  {
    id: "1",
    slug: "eco-friendly-apparel-sales-boost",
    title:
      "Eco-Friendly Apparel Brand Achieves 150% Sales Growth with a Storefront Redesign",
    client: "GreenWear Co.",
    category: "Eco-Friendly Apparel",
    image: "/assets/zenvyra-web.webp",
    summary:
      "How we helped GreenWear Co. increase their online sales by 150% through UX redesign and performance optimization.",
    challenge: `GreenWear Co. sells premium eco-friendly apparel, but their online store wasn’t performing.
      • Visitors were browsing, but not converting into customers.
      • Product presentation lacked clarity and visual impact.
      • The design felt cluttered, reducing focus on key products.
      • Mobile experience made it harder to explore and shop effortlessly.`,
    solution: `We reimagined the storefront using Shoptimity—clean, visual, and conversion-focused.

      • Refined the design to highlight apparel with strong visual storytelling.
      • Simplified navigation for effortless browsing across collections.
      • Improved product visibility with a clear and structured layout.
      • Optimized the shopping journey for faster, smoother checkout—especially on mobile.

Every change was made to create a seamless experience that feels modern, premium, and easy to shop.

1. Product Page Experience
    • Showcased apparel with high-quality lifestyle imagery and clear messaging.
    • Simplified product details to focus on material, fit, and sustainable origin.
    • Added social proof like reviews and “conscious choice” badges.

    ![Apparel Showcase](/assets/zenvyra-product-web.webp)

Every element was designed to help customers quickly connect with the product—and make a confident purchase.

2. Homepage Structure
    • Designed a modern, minimal homepage that spotlights eco-friendly storytelling.
    • Featured best sellers and new collections prominently.
    • Removed distractions to keep the focus on brand values and products.

    ![Apparel Showcase](/assets/zenvyra-web.webp)

The result is a first impression that feels modern, stylish, and premium.,

3. Mobile Optimization
    • Optimized layouts for smooth scrolling and easy browsing.
    • Simplified navigation for quick access to collections.
    • Improved speed to reduce drop-offs on mobile users.

        ![Apparel Showcase](/assets/three-mobile copy.webp)

The mobile experience became fast, fluid, and effortless.

4. Flexible Page Creation
    • Enabled quick setup of new collection and campaign pages.
    • Maintained a consistent look across all pages.
    • Eliminated the need for developer support for routine updates.

This made it simple to launch and scale new collections anytime.

5. Performance & Support
    • Improved site speed for a smoother shopping experience.
    • Ensured consistency across devices and browsers.
    • Provided ongoing support for continuous improvements.

The store now performs reliably—delivering a seamless shopping experience at every step.`,
    results: [
      "150% increase in overall online sales",
      "45% reduction in cart abandonment",
      "3x faster page load speeds on mobile",
    ],
    stats: [
      { value: "+150%", label: "Sales Growth", color: "text-emerald-500" },
      { value: "-45%", label: "Cart Abandonment", color: "text-orange-500" },
      { value: "3x", label: "Mobile Speed", color: "text-blue-600" },
    ],
    testimonial:
      "The team completely transformed our online presence. Our customers love the new fast experience!",
    testimonialAuthor: "Jane Doe, CEO of GreenWear Co.",
  },
  {
    id: "2",
    slug: "pet-nutrition-brand-achieves-5x-growth",
    title: "Pet Nutrition brand achieves 5x growth with new online store",
    client: "The Pampered Pup",
    category: "Pet Care E-commerce",
    image: "/assets/pet-web.webp",
    summary:
      "How a modern, high-converting online store helped a premium pet nutrition brand achieve 5x growth.",
    challenge: `The brand offered premium pet nutrition—but the online experience didn’t reflect the trust and care behind the products.
      • Visitors were browsing, but conversions remained lower than expected.
      • Product benefits were not clearly communicated to pet owners.
      • Visual presentation didn’t fully capture the quality and care.
      • Mobile experience felt cramped and difficult to navigate.`,
    solution: `We redesigned the online store to feel clean, trustworthy, and easy to shop.

      • Created a refreshed homepage that highlights natural ingredients and health benefits.
      • Added clear, benefit-focused product layouts with simple navigation.
      • Enhanced product pages with larger images, clear ingredient lists, and usage recommendations.
      • Improved mobile layout for smooth scrolling and effortless shopping.

Every detail was crafted to create confidence for pet owners—and make shopping feel simple and reliable.

1. Product Page Experience
    • Showcased natural ingredients and wellness benefits with engaging visuals.
    • Simplified product details to highlight key nutritional advantages.
    • Added usage recommendations and feeding guides for easy reference.



Every element was designed to help pet owners feel confident in every choice.

2. Homepage Structure
    • Designed a refreshed homepage that highlights natural ingredients and health benefits.
    • Featured best sellers and new collections prominently.
    • Removed distractions to keep the focus on health and trust.

    ![Pet Product Layout](/assets/pet-web.webp)

The result is a first impression that feels warm, reliable, and easy to connect with.

3. Mobile Optimization
    • Optimized layouts for smooth mobile browsing.
    • Streamlined navigation for faster product discovery.
    • Faster loading to keep pages snappy and responsive.

The mobile journey became fast, intuitive, and effortless.

4. Flexible Page Creation
    • Added new collections and seasonal pages quickly and easily.
    • Maintained a consistent, premium feel across all pages.
    • Reduced dependence on developers for routine updates.

This made it simple to grow and adapt the store over time.

5. Performance & Support
    • Improved stability for a seamless shopping experience.
    • Ensured consistency across devices and browsers.
    • Offered continuous support for ongoing improvements.

The store now delivers a smooth, trusted, and seamless shopping experience.`,
    results: [
      "5x increase in overall online orders",
      "65% higher customer engagement",
      "40% faster checkout completion",
    ],
    stats: [
      { value: "5x", label: "Online Orders", color: "text-emerald-500" },
      { value: "+65%", label: "Customer Engagement", color: "text-orange-500" },
      { value: "-40%", label: "Checkout Time", color: "text-blue-600" },
    ],
    testimonial:
      "The transformation was immediate—our sales and engagement simply took off.",
    testimonialAuthor: "Sarah Chen, Founder of The Pampered Pup",
  },
  {
    id: "3",
    slug: "global-expansion-multi-currency",
    title: "Elevating a Luxury Bag Brand Experience",
    client: "Artisan Crafts",
    category: "International Commerce",
    image: "/assets/bag-web.webp",
    summary:
      "Enabling Artisan Crafts to reach a global audience with localized pricing and multi-currency support.",
    challenge: `The brand offered a refined collection of bags—but the digital experience didn’t reflect its premium identity.
      • Visitors were browsing, but conversions remained low.
      • Product presentation lacked clarity and visual focus.
      • The design didn’t fully highlight craftsmanship and elegance.
      • Mobile experience felt less fluid, affecting the buying journey.`,
    solution: `We reimagined the storefront using Shoptimity—minimal, elegant, and conversion-focused.

      • Implemented a clean, modern layout that lets the craftsmanship shine.
      • Enhanced product pages with high-quality visuals and detailed storytelling.
      • Simplified navigation for a seamless discovery journey.
      • Optimized the mobile experience for effortless browsing and checkout.

Every detail was crafted to reflect the brand’s sophistication—while making the experience seamless to shop.

1. Product Page Experience
    • Added trust elements like reviews and product clarity.
    • Structured content to highlight materials, design, and usability.
    • Added trust elements like reviews and product clarity.

Every element was designed to create desire—and drive confident purchase decisions.

2. Homepage Structure
    • Designed an elegant homepage that highlights the art of cake making.
    • Featured best sellers and seasonal collections prominently.
    • Created a visually delightful experience that matches the brand's premium feel.

The result is a first impression that feels modern, stylish, and premium.

3. Mobile Optimization
    • Designed a minimal, editorial-style homepage.
    • Enhanced product pages with high-quality visuals and detailed storytelling.
    • Removed clutter to maintain a premium, focused look.

The mobile journey became fluid, intuitive, and effortless.

4. Flexible Page Creation
    • Enabled quick creation of campaign and collection pages.
    • Maintained a consistent luxury design across all pages.
    • Allowed easy updates without disrupting the experience.

This made it easy to evolve the brand while staying visually consistent.

5. Performance & Support
    • Improved site speed and responsiveness.
    • Ensured consistency across all devices and browsers.
    • Provided ongoing support for continuous refinement..

The store now delivers a smooth, reliable, and premium experience at every touchpoint.`,
    results: [
      "300% increase in international sales",
      "Support for 15+ local currencies",
      "Significant drop in international cart abandonment",
    ],
    stats: [
      { value: "300%", label: "Global Sales", color: "text-emerald-500" },
      { value: "15+", label: "Currencies", color: "text-orange-500" },
      { value: "-45%", label: "Cart Abandonment", color: "text-blue-600" },
    ],
    testimonial:
      "Going global was seamless. We're now shipping our crafts worldwide effortlessly.",
    testimonialAuthor: "Sarah Jenkins, Founder of Artisan Crafts",
  },
  {
    id: "4",
    slug: "premium-healthy-trail-mix-growth",
    title: "Premium Healthy Trail Mix",
    client: "NatureCrunch",
    category: "Food & Beverage E-Commerce",
    image: "/assets/yofresh.webp",
    summary:
      "How a fresh storefront design and optimized product pages helped NatureCrunch increase their online sales by 200%.",
    challenge: `NatureCrunch offered a highly rated premium trail mix, but their online store was holding them back.
      • Product pages failed to communicate the health benefits and natural ingredients clearly.
      • The site design looked dated and didn't align with their vibrant brand identity.
      • Visitors were bouncing before adding items to their cart.
      • The checkout process was clunky, leading to high abandonment rates.`,
    solution: `We reimagined the digital experience to reflect the freshness and quality of their trail mix.

      • Designed a fresh, inviting layout that highlights natural ingredients and health benefits.
      • Customized the customer portal to allow easy modifications, pausing, and skipping of deliveries.
      • Simplified the checkout process to encourage subscription sign-ups.
      • Optimized the mobile experience for managing subscriptions on the go.

Every detail was crafted to make staying healthy with premium snacks effortless and reliable.

1. Product Page Experience
    • Added trust elements like reviews and product clarity.
    • Structured content to highlight the natural ingredients and health benefits.
    • Simplified the layout for a cleaner, more focused presentation.

        ![Premium Trail Mix](/assets/yofresh-product.webp)

Customers could now clearly see why NatureCrunch was the healthier choice, boosting add-to-cart rates.

2. Engaging Homepage Structure
    • Designed a homepage that tells the story of their 100% natural, no-preservative ingredients.
    • Featured popular trail mixes and custom snack boxes prominently.
    • Used vibrant, earthy greens to evoke the feeling of fresh, healthy eating.
    
    ![Premium Trail Mix](/assets/yofresh.webp)

The result is a storefront that feels fresh, trustworthy, and crave-worthy.

3. Mobile Optimization
    • Engineered a mobile-first layout optimized for speed.
    • Simplified the menu for rapid navigation and discovery.
    • Reduced checkout friction for quick impulse purchases.

The mobile shopping experience became as effortless as grabbing a snack.

4. Flexible Page Creation
    • Set up custom landing pages for seasonal mixes and holiday gift boxes.
    • Maintained consistent branding across all promotional materials.
    • Allowed the marketing team to launch new campaigns quickly.

This flexibility helped drive continuous growth throughout the year.

5. Performance & Support
    • Optimized the site for lightning-fast loading, especially on mobile.
    • Ensured seamless integration with their fulfillment systems.
    • Provided ongoing support to refine the conversion funnel.

The store now acts as a reliable engine for long-term revenue growth.`,
    results: [
      "200% increase in overall online sales",
      "45% reduction in cart abandonment",
      "2x higher conversion rate on product pages",
    ],
    stats: [
      { value: "+200%", label: "Online Sales", color: "text-emerald-500" },
      { value: "-45%", label: "Cart Abandonment", color: "text-orange-500" },
      { value: "2x", label: "Conversion Rate", color: "text-blue-600" },
    ],
    testimonial:
      "The new store perfectly captures what our brand is all about. The sales growth has been unbelievable.",
    testimonialAuthor: "Sarah Jenkins, Co-founder of NatureCrunch",
  },
  //   {
  //     id: "5",
  //     slug: "activewear-conversion-optimization",
  //     title: "Premium Activewear Brand Boosts Conversions by 60%",
  //     client: "FitCore Athletics",
  //     category: "Activewear & Fitness",
  //     image: "/assets/gym-web.webp",
  //     summary: "Transforming a fitness apparel store into a high-converting, performance-driven experience.",
  //     challenge: `FitCore offered top-tier activewear, but their online store suffered from low engagement and high drop-offs.
  //       • Customers struggled to find the right gear for their specific workouts.
  //       • Product pages lacked detailed fit and fabric information.
  //       • The overall design felt generic and uninspiring.
  //       • The checkout flow was overly complicated, causing cart abandonment.`,
  //     solution: `We completely overhauled the digital experience to reflect the energy and performance of the brand.

  //       • Designed a dynamic, high-energy layout that inspires action.
  //       • Categorized products by workout type (e.g., running, lifting, yoga).
  //       • Upgraded product pages with detailed fabric specs and dynamic sizing charts.
  //       • Simplified the checkout process to a single-page seamless flow.

  // The new design empowers customers to find exactly what they need to perform their best.

  // 1. Performance-Driven Product Pages
  //     • Highlighted fabric technology and performance benefits clearly.
  //     • Included video clips of the activewear in motion.
  //     • Added a robust review system to build trust.

  //     ![Activewear Products](/assets/gym-web.webp)

  // Customers now have all the information they need to purchase with confidence.

  // 2. Inspiring Homepage
  //     • Built a vibrant homepage featuring high-impact fitness photography.
  //     • Showcased new arrivals and essential gear prominently.
  //     • Created clear pathways to shop by activity.

  //     ![Storefront Flow](/assets/fitcore-theme.webp)

  // The first impression is now motivating, energetic, and completely on-brand.

  // 3. Mobile Optimization
  //     • Designed a fluid mobile experience tailored for on-the-go shoppers.
  //     • Implemented sticky add-to-cart buttons for easy purchasing.
  //     • Optimized images to load instantly on cellular networks.

  // Mobile shopping is now as effortless as their activewear.

  // 4. Flexible Page Creation
  //     • Built custom templates for athlete collaborations and seasonal campaigns.
  //     • Maintained a consistent, high-energy aesthetic across the site.
  //     • Made content updates easy and intuitive for the marketing team.

  // The team can now launch campaigns faster than ever before.

  // 5. Ongoing Performance
  //     • Monitored user behavior to continuously optimize the checkout flow.
  //     • Ensured lightning-fast load times across the globe.
  //     • Provided dedicated support for ongoing store improvements.

  // The store is now a reliable, high-performing asset for the brand.`,
  //     results: [
  //       "60% increase in overall conversion rate",
  //       "25% increase in average order value",
  //       "Significant drop in return rates due to better fit info"
  //     ],
  //     stats: [
  //       { value: "+60%", label: "Conversion Rate", color: "text-emerald-500" },
  //       { value: "+25%", label: "AOV", color: "text-orange-500" },
  //       { value: "-15%", label: "Return Rate", color: "text-blue-600" }
  //     ],
  //     testimonial: "The redesign perfectly captures our brand's energy. We've seen incredible growth since launch.",
  //     testimonialAuthor: "Alex Taylor, CMO of FitCore Athletics"
  //   }
]
