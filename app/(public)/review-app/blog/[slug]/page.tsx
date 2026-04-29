import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock, Tag } from "lucide-react"
import { getShopifyArticleBySlug, getShopifyArticles } from "@/lib/shopify"
import { formatDate } from "@/lib/format"

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // Try app blog first, then fallback to theme blog
  let article = await getShopifyArticleBySlug(slug, "shoptimity-vtwo")
  let section: "shoptimity-vtwo" | "app" = "shoptimity-vtwo"

  if (!article) {
    article = await getShopifyArticleBySlug(slug, "app")
    section = "app"
  }

  if (!article) {
    notFound()
  }

  const allArticles = await getShopifyArticles(section)

  // Filter articles that share at least one tag with the current article
  const currentTags = article.tags || []
  const moreArticles = allArticles
    .filter((a) => a.handle !== slug)
    .filter((a) => a.tags?.some((tag) => currentTags.includes(tag)))
    .slice(0, 3)

  return (
    <article className="min-h-screen bg-base-100">
      {/* Header / Hero Section */}
      <header className="relative overflow-hidden pt-10 pb-20 md:pt-16 md:pb-32">
        <div className="absolute top-0 left-0 -z-10 h-full w-full bg-linear-to-br from-base-200 to-transparent opacity-60" />

        <div className="container mx-auto max-w-6xl px-4">
          <Link
            href="/review-app/blog"
            className="group mb-8 inline-flex cursor-pointer items-center gap-2 text-muted-foreground transition-colors hover:text-brand-orange"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            Back to Blogs
          </Link>

          <div className="mb-6 flex flex-wrap items-center gap-3">
            {article.tags?.map((tag) => (
              <span
                key={tag}
                className="bg-soft-orange rounded-full px-3 py-1 text-xs font-bold tracking-widest text-brand-orange uppercase"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="font-heading text-3xl leading-tight md:text-6xl">
            {article.title}
          </h1>
        </div>
      </header>

      {/* Article Content */}
      <div className="relative container mx-auto -mt-16 max-w-6xl px-4 pb-10">
        {article.image && (
          <div className="mb-8 overflow-hidden rounded-[2.5rem] shadow-2xl md:mb-16">
            <img
              src={article.image.url}
              alt={article.title}
              className="aspect-video w-full object-cover"
            />
          </div>
        )}

        <div
          className="blog-shoptimity mb-12 rounded-[2.5rem] border border-gray-50 bg-white p-8 shadow-xl shadow-gray-200/50 md:p-16"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />
      </div>

      {/* Read More Section */}
      {moreArticles.length > 0 && (
        <section className="bg-white/50 py-24">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="mb-12 text-center font-heading text-3xl md:text-5xl">
              Continue{" "}
              <span className="text-gradient-orange-pink">Reading</span>
            </h2>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {moreArticles.map((post) => (
                <Link
                  key={post.handle}
                  href={`/review-app/blog/${post.handle}`}
                  className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-gray-50 bg-white shadow-md transition-all duration-300 hover:shadow-xl"
                >
                  <div className="relative aspect-3/2 overflow-hidden">
                    <img
                      src={post.image?.url || "/blog/conversion.png"}
                      alt={post.title}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 flex flex-wrap gap-1">
                      {post.tags?.map((tag) => (
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
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>
                    <h3 className="mb-4 line-clamp-2 h-12 font-heading text-lg leading-snug transition-colors group-hover:text-brand-orange md:h-14 md:text-xl">
                      {post.title}
                    </h3>
                    <p className="mb-6 line-clamp-3 text-xs text-muted-foreground md:text-sm">
                      {post.body.replace(/<[^>]+>/g, "").slice(0, 120)}...
                    </p>
                    <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
                      <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                        <Clock size={12} className="text-muted-foreground/40" />
                        {`${Math.ceil(post.body.split(" ").length / 200)} min read`}
                      </span>
                      <span className="group/link flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-brand-orange uppercase">
                        Read Now
                        <ArrowLeft className="size-3 rotate-180 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  )
}
