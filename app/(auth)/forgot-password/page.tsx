import { Metadata } from "next"
import { ForgotPasswordClient } from "./forgot-password-client"
import { getMetadata } from "@/lib/metadata"

export const metadata = getMetadata({
  title: "Reset your Shoptimity Password",
  description:
    "Request a password reset link for your Shoptimity account to regain access to your dashboard.",
  pathname: "/forgot-password",
  robots: { index: false, follow: false },
})

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}
