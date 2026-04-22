export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"

import { getAppSession } from "@/lib/auth-session"
import { db } from "@/db"
import { users } from "@/db/schema"
import { Metadata } from "next"
import { ProfileClient } from "./profile-client"

export const metadata: Metadata = {
  title: "Profile | Shoptimity",
  description: "Manage your account settings and profile information.",
  alternates: {
    canonical: "https://shoptimity.com/profile",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default async function ProfilePage() {
  const session = await getAppSession()
  if (!session) redirect("/login")

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1)

  if (!user) redirect("/login")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings.
        </p>
      </div>
      <ProfileClient
        name={user.name}
        email={user.email}
        createdAt={user.createdAt.toISOString()}
      />
    </div>
  )
}
