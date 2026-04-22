import { Metadata } from "next"
import { RegisterClient } from "./register-client"

export const metadata: Metadata = {
  title: "Create your Shoptimity Account | Get Started",
  description:
    "Join Shoptimity to access premium Shopify templates and manage your theme licenses.",
  alternates: {
    canonical: "https://shoptimity.com/register",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function RegisterPage() {
  return <RegisterClient />
}
