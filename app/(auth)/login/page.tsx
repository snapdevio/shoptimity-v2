import { Metadata } from "next"
import { LoginClient } from "./login-client"

export const metadata: Metadata = {
  title: "Login to Shoptimity | Secure Access",
  description:
    "Sign in to your Shoptimity account to manage your Shopify theme licenses, assign domains, and download premium templates.",
  alternates: {
    canonical: "https://shoptimity.com/login",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginPage() {
  return <LoginClient />
}
