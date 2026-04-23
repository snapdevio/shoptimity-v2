import { Metadata } from "next"
import { ResetPasswordClient } from "./reset-password-client"

export const metadata: Metadata = {
  title: "Set New Password | Shoptimity",
  description: "Set a new password for your Shoptimity account.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}
