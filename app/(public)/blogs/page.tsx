import { getMetadata } from "@/lib/metadata"
import Link from "next/link"
import { ArrowRight, Calendar, Clock, Search, Tag } from "lucide-react"
import { getShopifyArticles } from "@/lib/shopify"

export const metadata = getMetadata({
  title: "Blogs",
  description:
    "Read Shoptimity's latest blog posts on Shopify growth, conversion optimization, and e-commerce strategy.",
  pathname: "/blogs",
})
import { formatDate } from "@/lib/format"
import BlogSearch from "./BlogSearch"

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>
}) {
  const params = await searchParams
  const activeCategory = params.category || "All"
  const activeQuery = params.q || ""
  const currentPage = parseInt(params.page || "1")
  const POSTS_PER_PAGE = 13

  const articles = await getShopifyArticles("shoptimity-vtwo")

  const allPosts =
    articles.length > 0
      ? articles.map((article, index) => ({
          id: article.handle,
          title: article.title,
          excerpt: article.body.replace(/<[^>]+>/g, "").slice(0, 160) + "...",
          image: article.image?.url || "/assets/blog-shoptimity-logo.webp",
          tags: article.tags || [],
          category: article.tags?.[0] || "All",
          date: formatDate(article.publishedAt),
          readTime: `${Math.ceil(article.body.split(" ").length / 200)} min read`,
          featured: index === 0,
        }))
      : []

  // Extract unique tags from all posts for categories
  const allTags = allPosts.flatMap((post) => post.tags)
  const dynamicCategories = ["All", ...Array.from(new Set(allTags))]

  // Filter posts based on active category (tag) and query
  const filteredPosts = allPosts.filter((post) => {
    const matchesCategory =
      activeCategory === "All" || post.tags.includes(activeCategory)
    const matchesQuery =
      !activeQuery ||
      post.title.toLowerCase().includes(activeQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(activeQuery.toLowerCase())
    return matchesCategory && matchesQuery
  })

  // Pagination Logic
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  )

  const featuredPost =
    currentPage === 1 && paginatedPosts.length > 0 ? paginatedPosts[0] : null
  const regularPosts = featuredPost ? paginatedPosts.slice(1) : paginatedPosts

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-6 font-heading text-3xl tracking-tight sm:text-5xl md:text-6xl">
            Shoptimity <span className="text-gradient-orange-pink">Blogs</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Insights, strategies, and stories for the modern e-commerce
            entrepreneur. Build faster, sell more, and grow smarter.
          </p>
        </div>
        {/* Search & Categories */}
        <div className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-wrap justify-center gap-2">
            {dynamicCategories.map((cat) => (
              <Link
                key={cat}
                href={
                  cat === "All"
                    ? "?"
                    : `?category=${encodeURIComponent(cat)}${activeQuery ? `&q=${activeQuery}` : ""}`
                }
                scroll={false}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  cat === activeCategory
                    ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/20"
                    : "border border-gray-100 bg-white text-muted-foreground hover:bg-white/80 hover:text-foreground"
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
          <BlogSearch />
        </div>
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Main Content */}
          <main className="flex-1">
            {/* Featured Post */}
            {featuredPost && (
              <Link
                href={`/blogs/${featuredPost.id}`}
                className="group mb-10 flex cursor-pointer flex-col-reverse overflow-hidden rounded-[1rem] border border-gray-100 bg-white shadow-lg shadow-gray-200/50 transition-all duration-500 hover:shadow-xl md:rounded-[2rem] lg:flex-row lg:items-stretch"
              >
                {/* Content */}
                <div className="flex flex-1 flex-col gap-4 p-6 sm:p-8 lg:gap-6 lg:p-10">
                  {/* Category Badge */}
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 rounded-full bg-linear-to-r from-[#ff602e] to-secondary px-4 py-2 text-xs font-bold tracking-wider text-white uppercase shadow-md">
                      <Tag size={12} />
                      Featured
                    </span>
                  </div>

                  {/* Tags */}
                  {/* <div className="flex flex-wrap items-center gap-2">
                    {featuredPost.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#ff602e]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div> */}

                  {/* Meta */}
                  <div className="flex items-center justify-between gap-3 text-sm text-gray-500">
                    {/* <span className="text-gray-300">|</span> */}
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      {featuredPost.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {featuredPost.readTime}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="font-heading text-2xl leading-tight font-medium text-gray-900 transition-colors group-hover:text-[#ff602e] lg:text-3xl">
                    {featuredPost.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="line-clamp-2 text-base leading-relaxed text-gray-600">
                    {featuredPost.excerpt}
                  </p>

                  {/* Read More */}
                  <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-[#ff602e] uppercase">
                    <span>Read Article</span>
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-2" />
                  </div>
                </div>

                {/* Image */}
                <div className="relative aspect-4/3 w-full overflow-hidden lg:w-1/2 lg:shrink-0">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="h-full w-full transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
              </Link>
            )}

            {/* Regular Posts Grid */}
            {regularPosts.length > 0 && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                {regularPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blogs/${post.id}`}
                    className="group flex cursor-pointer flex-col overflow-hidden rounded-[1rem] border border-gray-100 bg-white shadow-md shadow-gray-200/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl md:rounded-[1.5rem]"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-col gap-3 p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        {post.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-linear-to-r from-[#ff602e] to-secondary px-3 py-1 text-[9px] font-bold tracking-wide text-white uppercase shadow-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs font-medium text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} />
                          {post.date}
                        </span>
                        {/* <span className="text-gray-300">|</span> */}
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} />
                          {post.readTime}
                        </span>
                      </div>
                      <h3 className="line-clamp-2 font-heading text-xl leading-snug font-medium text-gray-900 transition-colors group-hover:text-[#ff602e]">
                        {post.title}
                      </h3>
                      <p className="line-clamp-2 text-sm text-gray-500">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-[#ff602e] uppercase">
                        <span>Read article</span>
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-2" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Empty State */}
            {filteredPosts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  No articles found
                </h3>
                <p className="mb-6 max-w-md text-sm text-gray-500">
                  We couldn&apos;t find any articles matching your search. Try
                  adjusting your filters or browse all categories.
                </p>
                <Link
                  href="/blogs"
                  className="cursor-pointer rounded-full bg-linear-to-r from-[#ff602e] to-secondary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Browse All Articles
                </Link>
              </div>
            )}

            {/* Pagination */}
            {filteredPosts.length > POSTS_PER_PAGE && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Link
                  href={`?${new URLSearchParams({
                    ...(activeCategory !== "All" && {
                      category: activeCategory,
                    }),
                    ...(activeQuery && { q: activeQuery }),
                    page: (currentPage - 1).toString(),
                  }).toString()}`}
                  className={`group flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold transition-all ${
                    currentPage <= 1
                      ? "pointer-events-none opacity-40"
                      : "hover:border-[#ff602e]/30 hover:bg-orange-50 hover:text-[#ff602e]"
                  }`}
                >
                  Previous
                </Link>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1
                    if (
                      totalPages > 5 &&
                      pageNum !== 1 &&
                      pageNum !== totalPages &&
                      Math.abs(pageNum - currentPage) > 1
                    ) {
                      if (pageNum === 2 || pageNum === totalPages - 1)
                        return (
                          <span key={pageNum} className="px-2 text-gray-400">
                            ...
                          </span>
                        )
                      return null
                    }

                    return (
                      <Link
                        key={pageNum}
                        href={`?${new URLSearchParams({
                          ...(activeCategory !== "All" && {
                            category: activeCategory,
                          }),
                          ...(activeQuery && { q: activeQuery }),
                          page: pageNum.toString(),
                        }).toString()}`}
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                          currentPage === pageNum
                            ? "bg-linear-to-r from-[#ff602e] to-secondary text-white shadow-md shadow-orange-200"
                            : "border border-gray-200 bg-white hover:border-[#ff602e]/30 hover:bg-orange-50 hover:text-[#ff602e]"
                        }`}
                      >
                        {pageNum}
                      </Link>
                    )
                  })}
                </div>

                <Link
                  href={`?${new URLSearchParams({
                    ...(activeCategory !== "All" && {
                      category: activeCategory,
                    }),
                    ...(activeQuery && { q: activeQuery }),
                    page: (currentPage + 1).toString(),
                  }).toString()}`}
                  className={`group flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold transition-all ${
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-40"
                      : "hover:border-[#ff602e]/30 hover:bg-orange-50 hover:text-[#ff602e]"
                  }`}
                >
                  Next
                </Link>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
