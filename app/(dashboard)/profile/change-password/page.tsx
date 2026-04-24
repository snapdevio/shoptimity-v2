import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getAppSession } from "@/lib/auth-session"
import { ChangePasswordClient } from "./change-password-client"

export const metadata: Metadata = {
  title: "Change Password | Shoptimity",
  description: "Update your account password.",
}

export default async function ChangePasswordPage() {
  const session = await getAppSession()
  if (!session) redirect("/login")

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Change Password
        </h1>
        <p className="text-sm text-muted-foreground">
          Update your password to keep your account secure.
        </p>
      </div>
      <ChangePasswordClient />
    </div>
  )
}
