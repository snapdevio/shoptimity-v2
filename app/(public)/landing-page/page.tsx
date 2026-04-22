import { Metadata } from "next"
import { getActivePlans } from "@/actions/admin-plans"
import dynamic from "next/dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const plans = await getActivePlans()
  const basePrice =
    plans && plans.length > 0
      ? `$${(plans[0].finalPrice / 100).toFixed(0)}`
      : "$79"

  return {
    title: `Shoptimity | High-Converting Shopify Theme for Just ${basePrice}`,
    description: `Get Shoptimity – a premium Shopify theme designed to boost conversions, increase AOV, and eliminate app costs. One-time payment of just ${basePrice}. Build a high-performing store today.`,
    alternates: {
      canonical: "https://shoptimity.com/",
    },
  }
}
import Hero from "@/components/site/Hero"
import BrandMarquee from "@/components/site/BrandMarquee"
import ReadyDemos from "@/components/site/ReadyDemos"
import MobileStickyCTA from "@/components/site/MobileStickyCTA"
import ScrollObserver from "@/components/site/ScrollObserver"

const FeaturesWave = dynamic(() => import("@/components/site/FeaturesWave"))
const MegaMenuSection = dynamic(
  () => import("@/components/site/MegaMenuSection")
)
// const AdvancedSearchSection = dynamic(
//   () => import("@/components/site/AdvancedSearchSection")
// )
const DifferenceSection = dynamic(
  () => import("@/components/site/DifferenceSection")
)
const TransformationSection = dynamic(
  () => import("@/components/site/TransformationSection")
)
const PricingSection = dynamic(() => import("@/components/site/PricingSection"))
const StepsSection = dynamic(() => import("@/components/site/StepsSection"))
const WorldClassBrandMarquee = dynamic(
  () => import("@/components/site/WorldClassBrandMarquee")
)
const WhyShoptimity = dynamic(() => import("@/components/site/WhyShoptimity"))
const CaseStudy = dynamic(() => import("@/components/site/CaseStudy"))
const WidgetsMarquee = dynamic(() => import("@/components/site/WidgetsMarquee"))
const NoMonthlyFee = dynamic(() => import("@/components/site/NoMonthlyFee"))
const BuiltForPros = dynamic(() => import("@/components/site/BuiltForPros"))
const ConversionFeatures = dynamic(
  () => import("@/components/site/ConversionFeatures")
)
const FAQ = dynamic(() => import("@/components/site/FAQ"))
const Footer = dynamic(() => import("@/components/site/Footer"))

export default async function HomePage() {
  return (
    <div className="App antialiased">
      <ScrollObserver />
      <Hero />
      <BrandMarquee />
      <ReadyDemos />
      <FeaturesWave />
      <MegaMenuSection />
      <TransformationSection />
      {/* <AdvancedSearchSection /> */}
      <PricingSection />
      <StepsSection />
      <DifferenceSection />
      <NoMonthlyFee />
      <WorldClassBrandMarquee />
      <WhyShoptimity />
      <CaseStudy />
      <WidgetsMarquee />
      <BuiltForPros />
      <ConversionFeatures />
      <FAQ />
      <Footer />
      <MobileStickyCTA />
    </div>
  )
}
