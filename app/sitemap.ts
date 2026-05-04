import { MetadataRoute } from "next"
import { getShopifyArticles } from "@/lib/shopify"
import { caseStudies } from "./(public)/case-study/data"
import { comparisonData } from "@/lib/comparison-data"

/**
 * Generates the sitemap for Shoptimity.
 * This includes all public-facing routes and dynamic blog posts from Shopify.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shoptimity.com"

  // Define static public routes
  const staticRoutes = [
    "",
    "/blogs",
    "/case-study",
    "/compare",
    "/contact",
    "/faq",
    "/landing-page",
    "/new-pricing",
    "/pages/why-brand-owners-are-switching-to-the-shoptimity-shopify-theme",
    "/pricing",
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

  // Fetch dynamic blog posts from Shopify
  const themeArticles = await getShopifyArticles("shoptimity-vtwo")
  const appArticles = await getShopifyArticles("app")

  const themeBlogRoutes = themeArticles.map((article) => ({
    url: `${baseUrl}/blogs/${article.handle}`,
    lastModified: new Date(article.publishedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  const appBlogRoutes = appArticles.map((article) => ({
    url: `${baseUrl}/review-app/blog/${article.handle}`,
    lastModified: new Date(article.publishedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  // Dynamic Case Studies
  const caseStudyRoutes = caseStudies.map((study) => ({
    url: `${baseUrl}/case-study/${study.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  // Dynamic Comparison Pages
  const compareRoutes = Object.keys(comparisonData).map((key) => ({
    url: `${baseUrl}/compare/shoptimity-vs-${key}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  return [
    ...staticRoutes,
    ...themeBlogRoutes,
    ...appBlogRoutes,
    ...caseStudyRoutes,
    ...compareRoutes,
  ]
}
