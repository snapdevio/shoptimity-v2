import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CheckCircle2, Quote } from "lucide-react"
import { caseStudies } from "../data"
import { formatTypography } from "@/lib/typography"
import { Badge } from "@/components/ui/badge"

const renderWithBlackNumbers = (text: string | string[]) => {
  if (typeof text !== "string") return text
  return text.split(/(^\s*\d+\..*$|!\[.*?\]\(.*?\))/m).map((part, i) => {
    if (!part) return null

    if (/^\s*\d+\..*$/.test(part)) {
      return (
        <span key={i} className="font-bold text-black dark:text-white">
          {part}
        </span>
      )
    }

    const imageMatch = part.match(/^!\[(.*?)\]\((.*?)\)$/)
    if (imageMatch) {
      const alt = imageMatch[1]
      const src = imageMatch[2]
      return (
        <div
          key={i}
          className="relative h-[400px] w-full overflow-hidden rounded-2xl shadow-sm sm:h-[414px]"
        >
          <Image src={src} alt={alt} fill className="object-cover" />
        </div>
      )
    }

    return <span key={i}>{part}</span>
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params
  const study = caseStudies.find((s) => s.slug === resolvedParams.slug)
  if (!study) return { title: "Case Study Not Found" }
  return {
    title: `${study.title} | Shoptimity Case Study`,
    description: study.summary,
  }
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params
  const study = caseStudies.find((s) => s.slug === resolvedParams.slug)

  if (!study) {
    notFound()
  }

  return (
    <article className="bg-background pb-20">
      {/* Hero Image & Header */}
      <div className="relative h-[60vh] min-h-[500px] w-full">
        <Image
          src={study.image}
          alt={study.title}
          fill
          className="object-cover brightness-50"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent" />

        <div className="relative container mx-auto flex h-full flex-col justify-end px-4 pb-16 sm:px-6 lg:px-8">
          <Link
            href="/case-study"
            className="mb-8 inline-flex w-fit items-center gap-2 rounded-full bg-background/20 px-4 py-2 text-sm font-medium text-black backdrop-blur-md transition-colors hover:bg-background/40"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Case Studies
          </Link>

          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-black/80 dark:text-white/80">
            <Badge
              variant="default"
              className="rounded-full border-none bg-primary/90 px-3 py-1 text-sm text-primary-foreground backdrop-blur-sm hover:bg-primary"
            >
              {study.category}
            </Badge>
            {/* <span>Client: {study.client}</span> */}
          </div>

          <h1 className="mt-6 font-heading text-3xl font-medium tracking-tight text-black sm:text-4xl lg:text-5xl dark:text-white">
            {formatTypography(study.title)}
          </h1>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mt-16 grid max-w-6xl gap-12 lg:grid-cols-3 lg:gap-16">
          {/* Main Content */}
          <div className="space-y-12 lg:col-span-2">
            <section>
              <h2 className="mb-4 font-heading text-3xl font-bold text-foreground">
                The Challenge
              </h2>
              <p className="text-lg leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {study.challenge}
              </p>
            </section>

            <section>
              <h2 className="mb-4 font-heading text-3xl font-bold text-foreground">
                Our Solution
              </h2>
              <div className="text-lg leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {renderWithBlackNumbers(study.solution)}
              </div>
            </section>

            {/* Testimonial block */}
            {/* <blockquote className="relative my-12 rounded-3xl bg-muted/50 p-8 sm:p-10">
              <Quote className="absolute top-8 right-8 h-12 w-12 text-primary/20" />
              <p className="relative z-10 text-xl leading-relaxed font-medium text-foreground italic sm:text-2xl">
                "{study.testimonial}"
              </p>
              <footer className="mt-6 font-semibold text-primary">
                — {study.testimonialAuthor}
              </footer>
            </blockquote> */}
          </div>

          {/* Sidebar (Results) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-3xl border bg-card p-8 shadow-sm">
              <h3 className="mb-6 font-heading text-2xl font-bold text-foreground">
                Key Results
              </h3>
              <ul className="space-y-6">
                {study.results.map((result, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-primary" />
                    <span className="font-lexend text-lg text-black">
                      {result}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <section className="container mx-auto mt-24 max-w-7xl px-4">
        <div className="flex flex-col items-center rounded-[40px] bg-orange-100 px-8 py-16 text-center md:py-24">
          <h2 className="max-w-2xl font-heading text-3xl font-medium md:text-4xl">
            Want to see similar results for your store?
          </h2>
          <p className="mt-6 max-w-xl text-gray-600 md:text-lg">
            Our experts can help you audit your current setup and implement the
            high-converting strategies used in this case study.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/plans"
              className="group flex items-center rounded-full bg-orange-600 px-8 py-4 font-semibold text-white transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-600/20"
            >
              Get Shoptimity Now
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="flex items-center rounded-full border border-gray-300 bg-white px-8 py-4 font-semibold text-gray-950 transition-all hover:bg-gray-50"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </article>
  )
}
