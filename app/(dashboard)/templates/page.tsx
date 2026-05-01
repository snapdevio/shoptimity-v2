export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { eq, and, or } from "drizzle-orm"
import { LockIcon } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Templates | Shoptimity",
  description: "Download Shopify theme templates and optimization packs.",
  alternates: {
    canonical: "https://shoptimity.com/templates",
  },
  robots: {
    index: false,
    follow: false,
  },
}

import { getAppSession } from "@/lib/auth-session"
import { db } from "@/db"
import { licenses } from "@/db/schema"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

import { getActiveTemplates } from "@/actions/admin-templates"
import { TemplateCard } from "@/components/template-card"

export default async function TemplatesPage() {
  const session = await getAppSession()
  if (!session) redirect("/login")

  const [activeLicenses, demos] = await Promise.all([
    db
      .select({ id: licenses.id })
      .from(licenses)
      .where(
        and(
          eq(licenses.userId, session.userId),
          or(eq(licenses.status, "active"), eq(licenses.status, "trialing"))
        )
      )
      .limit(1),
    getActiveTemplates(),
  ])

  const hasActiveLicense = activeLicenses.length > 0

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Templates
        </h1>
        <p className="text-sm text-muted-foreground">
          Download Shopify theme templates and optimization packs.
        </p>
      </div>

      {!hasActiveLicense && (
        <Card className="relative overflow-hidden border-orange-200 bg-orange-50/50 dark:border-orange-950/20 dark:bg-orange-950/10">
          <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-200/20 blur-2xl dark:bg-orange-500/10" />
          <div className="flex flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 ring-1 ring-orange-200 dark:bg-orange-500/10 dark:ring-orange-500/20">
                <LockIcon className="size-6 text-orange-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading text-lg font-semibold tracking-tight text-orange-900 dark:text-orange-100">
                  License Required
                </h3>
                <p className="text-sm text-orange-800/80 dark:text-orange-300/60">
                  Purchase any plan (Starter, Professional, or Agency) to unlock
                  unlimited downloads for all premium Shopify templates.
                </p>
              </div>
            </div>
            <Link
              href="/plans"
              className={cn(
                buttonVariants({ size: "sm" }),
                "cursor-pointer bg-orange-600 text-white hover:bg-orange-700 sm:w-auto"
              )}
            >
              Unlock Access &rarr;
            </Link>
          </div>
        </Card>
      )}

      <div className="grid gap-4 pb-10 sm:grid-cols-2 lg:grid-cols-3">
        {demos.map((demo) => (
          <TemplateCard
            key={demo.id}
            template={demo}
            hasActiveLicense={hasActiveLicense}
          />
        ))}
      </div>
    </div>
  )
}
