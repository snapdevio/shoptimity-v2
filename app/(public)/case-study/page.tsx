import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  BarChart3,
  Globe2,
  Layers,
  ShoppingBag,
  Zap,
} from "lucide-react"
import { caseStudies } from "./data"
import { formatTypography } from "@/lib/typography"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Case Studies | Shoptimity",
  description: "Explore how we've helped e-commerce brands scale and succeed.",
}

const categoryIcons: Record<string, React.ReactNode> = {
  "E-commerce Optimization": <ShoppingBag className="h-5 w-5" />,
  "Custom B2B Solutions": <Layers className="h-5 w-5" />,
  "International Commerce": <Globe2 className="h-5 w-5" />,
  "Subscription Services": <BarChart3 className="h-5 w-5" />,
  "Headless Commerce": <Zap className="h-5 w-5" />,
}

export default function CaseStudiesPage() {
  console.log(
    "Rendering CaseStudiesPage. Total case studies:",
    caseStudies.length
  )
  return (
    <div className="mx-auto max-w-7xl bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-25">
        <div className="bg-grid-black/[0.02] dark:bg-grid-white/[0.02] absolute inset-0" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-semi-bold font-heading text-4xl tracking-tight sm:text-5xl">
              Our Success <span className="text-primary">Stories</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              Discover how we partner with ambitious brands to transform their
              e-commerce experience, boost conversions, and drive sustainable
              growth.
            </p>
          </div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="container mx-auto mt-0 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {caseStudies.map((study, index) => (
            <Link
              key={study.id}
              href={`/case-study/${study.slug}`}
              className={`group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg ${
                index === 0 ? "md:col-span-2 lg:col-span-3 lg:flex-row" : ""
              }`}
            >
              <div
                className={`relative overflow-hidden ${
                  index === 0 ? "lg:w-3/5" : "aspect-video w-full"
                }`}
              >
                <Image
                  src={study.image}
                  alt={study.title}
                  width={800}
                  height={600}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div
                className={`flex flex-col justify-center p-6 sm:p-8 ${
                  index === 0 ? "lg:w-2/5" : "flex-1"
                }`}
              >
                <Badge
                  variant="secondary"
                  className="mb-4 w-fit rounded-full border-none bg-orange-100 px-3 py-1 text-sm text-orange-600 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-500"
                >
                  {categoryIcons[study.category] || <Zap className="h-4 w-4" />}
                  {study.category}
                </Badge>

                <h2
                  className={`mb-3 font-heading font-medium tracking-tight text-foreground transition-colors group-hover:text-primary ${
                    index === 0 ? "text-2xl sm:text-3xl" : "text-xl"
                  }`}
                >
                  {formatTypography(study.title)}
                </h2>

                <p className="mb-6 line-clamp-3 text-muted-foreground">
                  {study.summary}
                </p>

                {study.stats && (
                  <div className="mb-6 flex items-center justify-between border-y border-border py-4 text-center">
                    {study.stats.map((stat, i) => (
                      <div
                        key={i}
                        className="flex flex-1 flex-col items-center px-1"
                      >
                        <span className={`text-2xl font-bold ${stat.color}`}>
                          {stat.value}
                        </span>
                        <span className="mt-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                          {stat.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex items-center gap-2 font-medium text-primary">
                  Read Case Study
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="bg-white py-16 pt-0 md:py-24">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-[40px] bg-slate-950 px-8 py-16 text-center text-white md:py-24">
            <div className="relative z-10 mx-auto max-w-3xl">
              <h2 className="font-heading text-3xl font-medium md:text-5xl">
                Ready to become our next success story?
              </h2>
              <p className="mt-6 text-lg text-slate-300 md:text-xl">
                Join 1,000+ brands that have scaled their stores with
                Shoptimity. Start your transformation today.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link
                  href="/plans"
                  className="rounded-full bg-orange-600 px-8 py-4 font-semibold text-white transition-all hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-600/20"
                >
                  Start your free trial
                </Link>
                <Link
                  href="/contact"
                  className="rounded-full border border-gray-300 bg-white px-8 py-4 font-semibold text-gray-950 transition-all hover:bg-gray-50"
                >
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Background blobs */}
            <div className="absolute top-0 right-0 z-0 h-[300px] w-[300px] translate-x-1/3 -translate-y-1/3 rounded-full bg-orange-600/20 blur-[100px]" />
            <div className="absolute bottom-0 left-0 z-0 h-[300px] w-[300px] -translate-x-1/3 translate-y-1/3 rounded-full bg-pink-600/20 blur-[100px]" />
          </div>
        </div>
      </section>
    </div>
  )
}
