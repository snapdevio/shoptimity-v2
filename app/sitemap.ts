import { MetadataRoute } from "next"

/**
 * Generates the sitemap for Shoptimity.
 * This includes all public-facing routes and dynamic blog posts from Shopify.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shoptimity.com"

  // Define static public routes
  const staticRoutes = [
    "",
    "/checkout",
    "/contact",
    "/faq",
    "/landing-page",
    "/pages/why-brand-owners-are-switching-to-the-shoptimity-shopify-theme",
    "/plans",
    "/privacy-policy",
    "/refund-policy",
    "/review-app/blog",
    "/review-app/faq",
    "/review-app/privacy",
    "/setup",
    "/terms",
    "/thank-you",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }))

  return staticRoutes
}
