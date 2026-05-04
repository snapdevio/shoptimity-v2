import { getMetadata } from "@/lib/metadata"
import { notFound } from "next/navigation"
import { comparisonData } from "@/lib/comparison-data"
import ComparisonHero from "@/components/site/comparison/ComparisonHero"
import DynamicComparisonTable from "@/components/site/comparison/DynamicComparisonTable"
import ComparisonProsCons from "@/components/site/comparison/ComparisonProsCons"
import FeatureComparisonCard from "@/components/site/comparison/FeatureComparisonCard"
import ComparisonCTA from "@/components/site/comparison/ComparisonCTA"
import ScrollObserver from "@/components/site/ScrollObserver"
import OtherPageStickyCTA from "@/components/site/OtherPageStickyCTA"
import WhyChooseUs from "@/components/site/comparison/WhyChooseUs"

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = params

  if (!slug) {
    return getMetadata({
      title: "Shopify Theme Comparison",
      description:
        "Compare Shoptimity with other Shopify themes across features, pricing, and conversion value.",
      pathname: "/compare",
    })
  }

  const competitorKey = slug.replace("shoptimity-vs-", "")
  const data = comparisonData[competitorKey]

  if (!data) {
    return getMetadata({
      title: "Shopify Theme Comparison",
      description:
        "Compare Shoptimity with other Shopify themes across features, pricing, and conversion value.",
      pathname: `/compare/${slug}`,
    })
  }

  return getMetadata({
    title: `${data.name} vs Shoptimity`,
    description: `Compare Shoptimity to ${data.name} on performance, pricing, and ecommerce features.`,
    pathname: `/compare/${slug}`,
  })
}

interface ComparePageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ComparePage({ params }: ComparePageProps) {
  // Await the params object (Next.js 15 requirement)
  const resolvedParams = await params
  // Extract the competitor key from the URL (e.g., "shoptimity-vs-glozin" -> "glozin")
  const competitorKey = resolvedParams.slug.replace("shoptimity-vs-", "")
  const data = comparisonData[competitorKey]

  if (!data) {
    notFound()
  }

  return (
    <div className="App bg-white font-sans text-gray-900 antialiased selection:bg-orange-100 selection:text-orange-950">
      <ScrollObserver />

      <ComparisonHero
        competitorName={data.name}
        headline={data.heroHeadline}
        subheadline={data.heroSubheadline}
        imageSrc={data.heroImage}
      />

      <DynamicComparisonTable
        competitorName={data.name}
        features={data.features}
      />

      <ComparisonProsCons
        competitorName={data.name}
        pros={data.pros}
        cons={data.cons}
      />

      <FeatureComparisonCard features={data.featureCards} />
      <WhyChooseUs competitorName={data.name} />
      <ComparisonCTA />

      <OtherPageStickyCTA />
    </div>
  )
}
