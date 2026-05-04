import { getMetadata } from "@/lib/metadata"
import Link from "next/link"
import { ArrowRight, Calendar, Clock, User, Tag, Search } from "lucide-react"
import BlogSearch from "./BlogSearch"

export const metadata = getMetadata({
  title: "Review App Blog",
  description:
    "Browse Shoptimity's review app blog for ecommerce insights, Shopify tips, and customer success stories.",
  pathname: "/review-app/blog",
})
import { getShopifyArticles } from "@/lib/shopify"
import { formatDate } from "@/lib/format"

export default async function BlogShowcasePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>
}) {
  const params = await searchParams
  const activeCategory = params.category || "All"
  const activeQuery = params.q || ""
  const currentPage = parseInt(params.page || "1")
  const POSTS_PER_PAGE = 10

  const articles = await getShopifyArticles("app")

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
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute top-0 left-0 -z-10 h-100 w-full bg-linear-to-br from-base-200 to-transparent opacity-60" />
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-12 text-center">
            <h1 className="mb-6 font-heading text-5xl tracking-tight md:text-6xl">
              Shoptimity{" "}
              <span className="text-gradient-orange-pink">Blogs</span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
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

          {/* Featured Post */}
          {featuredPost && (
            <Link
              href={`/review-app/blog/${featuredPost.id}`}
              className="group relative mb-10 flex cursor-pointer flex-col overflow-hidden rounded-[2.5rem] border border-gray-100/50 bg-white shadow-2xl shadow-gray-200/60"
            >
              <div className="relative aspect-3/2 w-full overflow-hidden">
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-8 left-8">
                  <span className="rounded-lg bg-brand-orange px-4 py-1.5 text-[10px] font-black tracking-[0.2em] text-white uppercase shadow-xl">
                    Featured
                  </span>
                </div>
              </div>
              <div className="flex flex-col p-8 md:p-10">
                <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold text-brand-orange">
                  <Tag size={16} />
                  {featuredPost.tags.map((tag) => (
                    <span key={tag} className="tracking-widest uppercase">
                      {tag}
                    </span>
                  ))}
                  <span className="mx-2 h-1/2 w-px bg-gray-200" />
                  <Clock size={16} className="text-muted-foreground/40" />
                  <span className="tracking-widest text-muted-foreground/60 uppercase">
                    {featuredPost.readTime}
                  </span>
                </div>

                <h2 className="mb-6 max-w-4xl font-heading text-2xl leading-tight transition-colors group-hover:text-brand-orange md:text-5xl">
                  {featuredPost.title}
                </h2>

                <p className="mb-8 max-w-3xl text-sm leading-relaxed text-muted-foreground/80 md:text-lg">
                  {featuredPost.excerpt}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-6 border-t border-gray-50 pt-8">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-muted-foreground/60">
                      <Calendar size={18} />
                    </div>
                    <span className="text-sm font-bold text-foreground/80">
                      {featuredPost.date}
                    </span>
                  </div>

                  <span className="group/btn inline-flex items-center gap-4 text-sm font-black tracking-[0.2em] text-brand-orange uppercase transition-all">
                    Read Article
                    <ArrowRight className="size-5 transition-transform group-hover/btn:translate-x-2" />
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Grid Section */}
          {regularPosts.length > 0 && (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {regularPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/review-app/blog/${post.id}`}
                  className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-gray-50 bg-white shadow-md transition-all duration-300 hover:shadow-xl"
                >
                  <div className="relative aspect-3/2 overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 flex flex-wrap gap-1">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold tracking-widest text-brand-orange uppercase shadow-sm backdrop-blur-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-8">
                    <div className="mb-4 flex items-center gap-4 text-[10px] font-bold tracking-widest text-muted-foreground/70 uppercase">
                      <span>{post.date}</span>
                    </div>
                    <h3 className="mb-4 line-clamp-2 h-12 font-heading text-lg leading-snug transition-colors group-hover:text-brand-orange md:h-14 md:text-xl">
                      {post.title}
                    </h3>
                    <p className="mb-6 line-clamp-3 text-xs text-muted-foreground md:text-sm">
                      {post.excerpt}
                    </p>
                    <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
                      <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                        <Clock size={12} />
                        {post.readTime}
                      </span>
                      <span className="group/link flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-brand-orange uppercase">
                        Read Now
                        <ArrowRight className="size-3 transition-transform group-hover/link:translate-x-1" />
                      </span>
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
                href="/review-app/blog"
                className="cursor-pointer rounded-full bg-brand-orange px-8 py-3 text-sm font-bold text-white shadow-lg shadow-brand-orange/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                Browse All Articles
              </Link>
            </div>
          )}

          {/* Pagination Section */}
          {filteredPosts.length > POSTS_PER_PAGE && (
            <div className="mt-20 flex items-center justify-center gap-2">
              {/* Previous Button */}
              <Link
                href={`?${new URLSearchParams({
                  ...(activeCategory !== "All" && { category: activeCategory }),
                  ...(activeQuery && { q: activeQuery }),
                  page: (currentPage - 1).toString(),
                }).toString()}`}
                className={`flex items-center gap-1.5 rounded-full border border-gray-100 bg-white px-5 py-2.5 text-sm font-bold shadow-sm transition-all hover:bg-gray-50 ${
                  currentPage <= 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }`}
              >
                <ArrowRight className="size-4 rotate-180" />
                Prev
              </Link>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1
                // Only show a few page numbers around the current page if there are many pages
                if (
                  totalPages > 5 &&
                  pageNum !== 1 &&
                  pageNum !== totalPages &&
                  Math.abs(pageNum - currentPage) > 1
                ) {
                  if (pageNum === 2 || pageNum === totalPages - 1)
                    return (
                      <span
                        key={pageNum}
                        className="px-1 text-muted-foreground/50"
                      >
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
                        ? "bg-brand-orange text-white shadow-lg shadow-brand-orange/20"
                        : "cursor-pointer border border-gray-100 bg-white hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </Link>
                )
              })}

              {/* Next Button */}
              <Link
                href={`?${new URLSearchParams({
                  ...(activeCategory !== "All" && { category: activeCategory }),
                  ...(activeQuery && { q: activeQuery }),
                  page: (currentPage + 1).toString(),
                }).toString()}`}
                className={`flex items-center gap-1.5 rounded-full border border-gray-100 bg-white px-5 py-2.5 text-sm font-bold shadow-sm transition-all hover:bg-gray-50 ${
                  currentPage >= totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }`}
              >
                Next
                <ArrowRight className="size-4" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
