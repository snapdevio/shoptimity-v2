import { Metadata } from "next"
import { getActivePlans } from "@/actions/admin-plans"
import dynamic from "next/dynamic"

export const metadata: Metadata = {
  title:
    "Shoptimity | Build a High-Converting Shopify Store Without Paying for 10+ Apps",
  description:
    "Build a high-converting Shopify store without paying for 10+ separate apps. Shoptimity is the all-in-one theme designed to boost AOV and cut monthly costs.",
  alternates: {
    canonical: "https://shoptimity.com/landing-page",
  },
}

import LandingHero from "@/components/site/LandingHero"
import LandingPageTicker from "@/components/site/LandingPageTicker"
import LandingFeaturesGrid from "@/components/site/LandingFeaturesGrid"
import ThemeBlockSection from "@/components/site/ThemeBlockSection"
import MobileFirstSection from "@/components/site/MobileFirstSection"
import BrandMarquee from "@/components/site/BrandMarquee"
import ReadyDemos from "@/components/site/ReadyDemos"
import MobileStickyCTA from "@/components/site/MobileStickyCTA"
import ScrollObserver from "@/components/site/ScrollObserver"

const DifferenceSection = dynamic(
  () => import("@/components/site/DifferenceSection")
)
const TransformationSection = dynamic(
  () => import("@/components/site/TransformationSection")
)
const NewPricingSection = dynamic(
  () => import("@/components/site/NewPricingSection")
)
const StepsSection = dynamic(() => import("@/components/site/StepsSection"))
const CaseStudy = dynamic(() => import("@/components/site/CaseStudy"))
const FAQ = dynamic(() => import("@/components/site/FAQ"))
const Footer = dynamic(() => import("@/components/site/Footer"))

export default async function LandingPage() {
  // const plans = await getActivePlans()
  //   const basePrice =
  //     plans && plans.length > 0
  //       ? `$${(plans[0].finalPrice / 100).toFixed(0)}`
  //       : "$79"

  const caseStudies = [
    { badge: "CRO", value: "+44", label: "Conversion Rate" },
    { badge: "REV", value: "+70", label: "Revenue Increase" },
    { badge: "AOV", value: "+5", label: "AOV Lift" },
    { badge: "ROAS", value: "+20", label: "Profitable Ad Speed" },
    { badge: "CAC", value: "-30", label: "Old Customer" },
    { badge: "CRC", value: "-20", label: "New Customer" },
  ]

  return (
    <div className="App antialiased">
      <ScrollObserver />
      <LandingHero />
      <ReadyDemos />
      <NewPricingSection />
      <ThemeBlockSection />
      <DifferenceSection
        headline="Everything You Need <span class='text-gradient-orange-pink'>Built In</span>"
        subheadline="Stop paying for 10+ separate apps. Shoptimity includes everything you need to convert customers at one low price."
      />
      <StepsSection />
      <TransformationSection />
      <CaseStudy
        headline="Real Brands. Real Results."
        caseStudiesOverride={caseStudies}
      />
      <LandingFeaturesGrid />
      <LandingPageTicker />
      <MobileFirstSection />
      <FAQ />
      <BrandMarquee />
      <Footer />
      <MobileStickyCTA />
    </div>
  )
}
