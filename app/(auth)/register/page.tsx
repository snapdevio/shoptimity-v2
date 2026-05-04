import { Metadata } from "next"
import { RegisterClient } from "./register-client"
import { getMetadata } from "@/lib/metadata"

export const metadata = getMetadata({
  title: "Create your Shoptimity Account | Get Started",
  description:
    "Join Shoptimity to access premium Shopify templates and manage your theme licenses.",
  pathname: "/register",
  robots: { index: false, follow: false },
})

export default function RegisterPage() {
  return <RegisterClient />
}
