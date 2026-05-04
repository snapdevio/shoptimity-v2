import { Metadata } from "next"
import { ResetPasswordClient } from "./reset-password-client"
import { getMetadata } from "@/lib/metadata"

export const metadata = getMetadata({
  title: "Set New Password",
  description: "Set a new password for your Shoptimity account.",
  pathname: "/reset-password",
  robots: { index: false, follow: false },
})
export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}
