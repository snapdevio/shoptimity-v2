"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-zinc-50/50 px-4 py-12 dark:bg-zinc-950/50">
      <div className="w-full max-w-sm">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w- auto relative h-10">
              <img
                src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT || ""}/assets/logo.svg`}
                alt="Shoptimity Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Premium Conversion-Optimized Shopify Theme
          </p>
        </div>

        <div>{children}</div>
      </div>
    </div>
  )
}
