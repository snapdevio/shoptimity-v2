import { Metadata } from "next"
import { FAQClient } from "./faq-client"

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Shoptimity",
  description:
    "Find answers to common questions about Shoptimity Shopify theme, licensing, installation, and more.",
  alternates: {
    canonical: "https://shoptimity.com/faq",
  },
}

export default function FAQPage() {
  return <FAQClient />
}
