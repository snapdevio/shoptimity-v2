"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function VerifyClient() {
  const router = useRouter()

  useEffect(() => {
    // Better Auth handles magic link verification via its own callback URL.
    // If a user lands here directly, redirect to login.
    router.replace("/login")
  }, [router])

  return (
    <Card className="border-border/50 bg-card/50 shadow-xl backdrop-blur-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
          <Spinner className="size-8" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Verifying your login
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Please wait while we verify your login link. You will be redirected
          shortly.
        </CardDescription>
      </CardHeader>
      <CardContent className="border-t border-border/50 pt-6 text-center">
        <p className="text-sm text-muted-foreground/80">
          If you are not redirected automatically, please try requesting a new
          login link from the login page.
        </p>
      </CardContent>
    </Card>
  )
}
