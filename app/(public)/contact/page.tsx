import { Metadata } from "next"
import { ContactClient } from "./contact-client"

export const metadata: Metadata = {
  title: "Contact Us | Shoptimity Support",
  description:
    "Have questions about Shoptimity? Our support team is here to help. Reach out to us for technical assistance, billing inquiries, or general questions.",
  alternates: {
    canonical: "https://shoptimity.com/contact",
  },
}

export default function ContactPage() {
  return <ContactClient />
}
