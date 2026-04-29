"use client"

import { useState } from "react"
import Link from "next/link"
import {
  MailIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from "lucide-react"
import { usePostHog } from "posthog-js/react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"

function getInboxDetails(email: string) {
  const domain = email.split("@")[1]?.toLowerCase()
  if (!domain) return null

  const searchTerm = encodeURIComponent("Reset your Shoptimity password")

  if (domain.includes("gmail.com") || domain.includes("googlemail.com")) {
    return {
      name: "Gmail",
      url: `https://mail.google.com/mail/u/0/#search/${searchTerm}`,
    }
  }

  if (
    ["outlook.com", "hotmail.com", "live.com", "msn.com"].some((d) =>
      domain.includes(d)
    )
  ) {
    return {
      name: "Outlook",
      url: `https://outlook.live.com/mail/0/search/results?q=${searchTerm}`,
    }
  }

  if (domain.includes("yahoo.com")) {
    return {
      name: "Yahoo Mail",
      url: `https://mail.yahoo.com/d/search/keyword=${searchTerm}`,
    }
  }

  return null
}

export function ForgotPasswordClient() {
  const posthog = usePostHog()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleRequestReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    posthog.capture("password_reset_requested", {
      email: email.trim().toLowerCase(),
    })
    try {
      const { error } = await authClient.requestPasswordReset({
        email: email.trim().toLowerCase(),
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(
          error.message || "Failed to send reset link. Please try again."
        )
        return
      }

      setSuccess(true)
    } catch {
      setError("Unable to connect. Please check your internet and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="relative h-10 w-auto">
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

        {success ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
                <CheckCircleIcon className="size-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Check your email
              </CardTitle>
              <CardDescription className="text-base">
                We've sent a password reset link to{" "}
                <strong className="font-semibold text-foreground">
                  {email}
                </strong>
                . Please check your inbox and follow the instructions.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0">
              {(() => {
                const inbox = getInboxDetails(email)
                if (inbox) {
                  return (
                    <Button asChild className="w-full rounded-full" size="lg">
                      <a
                        href={inbox.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        <MailIcon className="size-5" />
                        Go to {inbox.name}
                      </a>
                    </Button>
                  )
                }
                // Fallback for custom domains
                const searchTerm = encodeURIComponent(
                  "Reset your Shoptimity password"
                )
                return (
                  <div className="flex flex-col gap-3">
                    <Button
                      asChild
                      className="flex w-full items-center justify-center gap-2 rounded-full"
                      size="lg"
                    >
                      <a
                        href={`https://mail.google.com/mail/u/0/#search/${searchTerm}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MailIcon className="size-5" />
                        Open in Gmail
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="flex w-full items-center justify-center gap-2 rounded-full"
                      size="lg"
                    >
                      <a
                        href={`https://outlook.live.com/mail/0/search/results?q=${searchTerm}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MailIcon className="size-5" />
                        Open in Outlook
                      </a>
                    </Button>
                  </div>
                )
              })()}
            </CardContent>
            <CardFooter className="justify-center border-t border-border/50 pt-6">
              <Link
                href="/login"
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                Back to login
              </Link>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Reset your password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your
                password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircleIcon className="size-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleRequestReset} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Spinner className="mr-2" />
                      Sending link...
                    </>
                  ) : (
                    <>
                      <MailIcon className="mr-2 size-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="justify-center">
              <Link
                href="/login"
                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                <ArrowLeftIcon className="size-4" />
                Back to login
              </Link>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
