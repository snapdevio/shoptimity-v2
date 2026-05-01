import { getMetadata } from "@/lib/metadata"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react"
import { getShopifyArticleBySlug, getShopifyArticles } from "@/lib/shopify"
import { formatDate } from "@/lib/format"

// Shared function to fetch article from both sections
async function getArticle(slug: string) {
  let article = await getShopifyArticleBySlug(slug, "shoptimity-vtwo")
  let section: "shoptimity-vtwo" | "app" = "shoptimity-vtwo"

  if (!article) {
    article = await getShopifyArticleBySlug(slug, "app")
    section = "app"
  }

  return { article, section }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = await params

  try {
    console.log("[Metadata] Fetching article for slug:", slug)
    const { article } = await getArticle(slug)

    console.log("[Metadata] Article found:", article?.title || "NOT FOUND")

    if (!article) {
      console.log("[Metadata] Using generic fallback for:", slug)
      return getMetadata({
        title: "Blog Post",
        description:
          "Read insights on Shopify growth, store optimization, and ecommerce strategy.",
        pathname: `/blogs/${slug}`,
      })
    }

    const title = article.title || "Blog Post"
    const description =
      (typeof article.body === "string"
        ? article.body.replace(/<[^>]+>/g, "").slice(0, 160)
        : "") ||
      "Read insights on Shopify growth, store optimization, and ecommerce strategy."

    console.log("[Metadata] Generated metadata with title:", title)

    return getMetadata({
      title,
      description,
      pathname: `/blogs/${slug}`,
      image: article.image?.url,
    })
  } catch (error) {
    console.error("[Metadata] Error generating metadata:", error)
    return getMetadata({
      title: "Blog Post",
      description:
        "Read insights on Shopify growth, store optimization, and ecommerce strategy.",
      pathname: `/blogs/${slug}`,
    })
  }
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { article, section } = await getArticle(slug)

  if (!article) {
    notFound()
  }

  const allArticles = await getShopifyArticles(section)

  // Filter articles that share at least one tag with the current article
  const currentTags = article.tags || []
  const moreArticles = allArticles
    .filter((a) => a.handle !== slug)
    .filter((a) => a.blogHandle === article.blogHandle)
    .filter((a) => a.tags?.some((tag) => currentTags.includes(tag)))
    .slice(0, 3)

  return (
    <article className="min-h-screen bg-base-100">
      {/* Header / Hero Section */}
      <header className="relative overflow-hidden pt-10 pb-10 sm:pt-16 md:pt-24">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-orange-50/50 via-pink-50/30 to-transparent" />

        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 h-3 w-3 animate-pulse rounded-full bg-[#ff602e]/20" />
        <div className="absolute top-32 right-20 h-2 w-2 animate-pulse rounded-full bg-secondary/30 delay-100" />
        <div className="absolute bottom-20 left-1/4 h-2 w-2 animate-pulse rounded-full bg-[#ff602e]/15 delay-200" />

        <div className="relative container mx-auto max-w-6xl px-4">
          <Link
            href="/blogs"
            className="group mb-8 inline-flex cursor-pointer items-center gap-2 rounded-full border border-orange-300 bg-slate-50 px-5 py-2.5 text-sm font-medium text-gray-600 shadow-sm backdrop-blur-sm transition-all hover:border-[#ff602e]/40 hover:bg-white hover:text-[#ff602e] hover:shadow-md"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            Back to Blogs
          </Link>

          {/* Tags & Meta */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {article.tags?.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-linear-to-r from-[#ff602e] to-secondary px-4 py-1.5 text-xs font-bold tracking-wider text-white uppercase shadow-md"
              >
                {tag}
              </span>
            ))}
            <span className="hidden text-xs text-gray-300 sm:inline">|</span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={14} className="text-[#ff602e]" />
              <span>{formatDate(article.publishedAt)}</span>
            </div>
            <span className="hidden text-xs text-gray-300 sm:inline">|</span>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Clock size={14} className="text-[#ff602e]" />
              <span>
                {Math.ceil(article.body.split(" ").length / 200)} min read
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-heading text-2xl leading-tight font-medium text-gray-900 md:text-3xl lg:text-5xl">
            {article.title}
          </h1>
        </div>
      </header>

      {/* Article Content */}
      <div className="relative container mx-auto max-w-6xl px-4 pb-6 md:pb-12">
        {article.image && (
          <div className="mb-10 overflow-hidden rounded-[2rem] border border-gray-100 shadow-2xl shadow-gray-200/50 md:mb-14">
            <img
              src={article.image.url}
              alt={article.title}
              className="aspect-video w-full object-cover"
            />
          </div>
        )}

        {/* Article Body */}
        <div
          className="blog-shoptimity rounded-[2rem] border border-gray-100 bg-slate-50 p-6 shadow-xl shadow-gray-200/30 md:p-10 lg:p-12"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />

        {/* Share Section */}
        {/* <div className="mb-20 flex flex-col items-center gap-4">
          <span className="text-sm font-medium text-gray-500">Share this article</span>
          <div className="flex items-center gap-3">
            <button className="group flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all hover:border-[#ff602e]/30 hover:bg-orange-50 hover:text-[#ff602e] hover:shadow-md">
              <X className="size-4" />
            </button>
            <button className="group flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all hover:border-[#ff602e]/30 hover:bg-orange-50 hover:text-[#ff602e] hover:shadow-md">
              <LinkedinIcon className="size-4" />
            </button>
            <button className="group flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all hover:border-[#ff602e]/30 hover:bg-orange-50 hover:text-[#ff602e] hover:shadow-md">
              <FacebookIcon className="size-4" />
            </button>
            <button className="group flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all hover:border-[#ff602e]/30 hover:bg-orange-50 hover:text-[#ff602e] hover:shadow-md">
              <Share2 className="size-4" />
            </button>
          </div>
        </div> */}
      </div>

      {/* Read More Section */}
      {moreArticles.length > 0 && (
        <section className="border-t border-gray-100 bg-white/50 py-20">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mb-14 text-center">
              <span className="mb-4 inline-flex items-center gap-2 text-sm font-bold tracking-widest text-[#ff602e] uppercase">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff602e]" />
                Discover More
              </span>
              <h2 className="font-heading text-3xl font-medium text-gray-900 md:text-4xl">
                Continue{" "}
                <span className="text-gradient-orange-pink">Reading</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {moreArticles.map((post) => (
                <Link
                  key={post.handle}
                  href={`/blogs/${post.handle}`}
                  className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-lg shadow-gray-200/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={
                        post.image?.url || "/assets/blog-shoptimity-logo.webp"
                      }
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      {post.tags?.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-linear-to-r from-[#ff602e] to-secondary px-3 py-1 text-[9px] font-bold tracking-wide text-white uppercase shadow-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mb-3 flex items-center justify-between text-xs font-medium text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {formatDate(post.publishedAt)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {`${Math.ceil(post.body.split(" ").length / 200)} min`}
                      </span>
                    </div>
                    <h3 className="mb-3 line-clamp-2 font-heading text-xl font-medium text-gray-900 transition-colors group-hover:text-[#ff602e]">
                      {post.title}
                    </h3>
                    <p className="mb-4 line-clamp-2 text-sm text-gray-500">
                      {post.body.replace(/<[^>]+>/g, "").slice(0, 100)}...
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-sm font-bold tracking-wide text-[#ff602e] uppercase">
                      <span>Read</span>
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-2" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* View All Button */}
            <div className="mt-14 text-center">
              <Link
                href="/blogs"
                className="group inline-flex cursor-pointer items-center gap-3 rounded-full bg-linear-to-r from-[#ff602e] to-secondary px-8 py-4 font-bold text-white shadow-lg shadow-orange-200 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                View All Articles
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-2" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </article>
  )
}
