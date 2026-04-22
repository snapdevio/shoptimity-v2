import { Metadata } from "next"

export const metadata: Metadata = {
  title:
    "Why Brand Owners are Switching to Shoptimity | High-Converting Shopify Theme",
  description:
    "Discover why 1,000+ top Shopify brands are upgrading to Shoptimity. Get premium design elements, high-CVR layouts, and 10+ free proven templates to scale your store today.",
  alternates: {
    canonical:
      "https://shoptimity.com/pages/why-brand-owners-are-switching-to-the-shoptimity-shopify-theme",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
