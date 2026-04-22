import { MetadataRoute } from "next"

import { getShopifyArticles } from "@/lib/shopify"

/**
 * Generates the sitemap specifically for blog posts.
 * Accessible at /blog/sitemap.xml
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shoptimity.com"

  // Fetch dynamic blog posts from Shopify
  const articles = await getShopifyArticles()

  return articles.map((article) => ({
    url: `${baseUrl}/review-app/blog/${article.handle}`,
    lastModified: new Date(article.publishedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))
}
