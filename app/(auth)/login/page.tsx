import { Metadata } from "next"
import { LoginClient } from "./login-client"
import { getMetadata } from "@/lib/metadata"

export const metadata = getMetadata({
  title: "Login",
  description:
    "Sign in to your Shoptimity account to manage your Shopify theme licenses, assign domains, and download premium templates.",
  pathname: "/login",
  robots: { index: false, follow: false },
})

export default function LoginPage() {
  return <LoginClient />
}
