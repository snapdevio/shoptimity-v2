import { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Checkout | Shoptimity",
  description:
    "Complete your purchase of Shoptimity Shopify theme. Secure checkout for your premium theme license.",
  alternates: {
    canonical: "https://shoptimity.com/checkout",
  },
}
import { Loader2 } from "lucide-react"
import { getAppSession } from "@/lib/auth-session"
import { db } from "@/db"
import { domains, users } from "@/db/schema"
import { eq, desc, isNull, and } from "drizzle-orm"
import { CheckoutForm } from "./checkout-form"

async function getInitialData() {
  const session = await getAppSession()
  if (!session) return null

  // Fetch full user record for name
  const [userRecord] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1)

  // Fetch most recent active domain
  const [lastDomain] = await db
    .select({ domainName: domains.domainName })
    .from(domains)
    .where(and(eq(domains.userId, session.userId), isNull(domains.deletedAt)))
    .orderBy(desc(domains.createdAt))
    .limit(1)

  return {
    name: userRecord?.name || "",
    email: userRecord?.email || session.email,
    domain: lastDomain?.domainName || "",
  }
}

export default async function CheckoutPage() {
  const initialData = await getInitialData()

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CheckoutForm
        initialName={initialData?.name}
        initialEmail={initialData?.email}
      />
    </Suspense>
  )
}
