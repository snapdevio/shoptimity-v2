import { Metadata } from "next"
import { VerifyClient } from "./verify-client"

export const metadata: Metadata = {
  title: "Verifying Your Login | Shoptimity",
  description:
    "Please wait while we verify your secure login link to Shoptimity.",
  alternates: {
    canonical: "https://shoptimity.com/verify",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function VerifyPage() {
  return <VerifyClient />
}
