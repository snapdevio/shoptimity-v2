import { Metadata } from "next"
import { ForgotPasswordClient } from "./forgot-password-client"

export const metadata: Metadata = {
  title: "Reset your Shoptimity Password",
  description:
    "Request a password reset link for your Shoptimity account to regain access to your dashboard.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}
