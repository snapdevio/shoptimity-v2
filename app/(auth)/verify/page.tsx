import { Metadata } from "next"
import { VerifyClient } from "./verify-client"
import { getMetadata } from "@/lib/metadata"

export const metadata = getMetadata({
  title: "Verifying Your Login",
  description:
    "Please wait while we verify your secure login link to Shoptimity.",
  pathname: "/verify",
  robots: { index: false, follow: false },
})

export default function VerifyPage() {
  return <VerifyClient />
}
