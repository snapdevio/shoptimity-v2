import { Metadata } from "next"
import { FAQClient } from "./faq-client"
import { getMetadata } from "@/lib/metadata"

export const metadata = getMetadata({
  title: "Frequently Asked Questions",
  description:
    "Find answers to common questions about Shoptimity Shopify theme, licensing, installation, and more.",
  pathname: "/faq",
})
export default function FAQPage() {
  return <FAQClient />
}
