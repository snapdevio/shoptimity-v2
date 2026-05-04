import { Metadata } from "next"
import { ContactClient } from "./contact-client"
import { getMetadata } from "@/lib/metadata"

export const metadata = getMetadata({
  title: "Contact Us Support",
  description:
    "Have questions about Shoptimity? Our support team is here to help. Reach out to us for technical assistance, billing inquiries, or general questions.",
  pathname: "/contact",
})
export default function ContactPage() {
  return <ContactClient />
}
