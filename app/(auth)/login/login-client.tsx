"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { MailIcon, AlertCircleIcon, CheckCircleIcon } from "lucide-react"
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

const ERROR_MESSAGES: Record<string, string> = {
  invalid_token: "The login link is invalid. Please request a new one.",
  invalid_or_expired_token:
    "The login link has expired or already been used. Please request a new one.",
  account_not_found: "The account associated with this link no longer exists.",
}

function getInboxDetails(email: string) {
  const domain = email.split("@")[1]?.toLowerCase()
  if (!domain) return null

  const searchTerm = encodeURIComponent("Sign in to Shoptimity")

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

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const posthog = usePostHog()
  const errorParam = searchParams.get("error")
  const redirectParam = searchParams.get("redirect") || "/licenses"

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    errorParam
      ? (ERROR_MESSAGES[errorParam] ?? "An unexpected error occurred.")
      : null
  )
  const [success, setSuccess] = useState(false)

  const { data: session, isPending: isSessionLoading } = authClient.useSession()

  useEffect(() => {
    if (session) {
      router.push(redirectParam)
    }
  }, [session, router, redirectParam])

  async function handleMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    posthog.capture("login_requested", {
      email: email.trim().toLowerCase(),
    })

    try {
      const { error: authError } = await authClient.signIn.magicLink({
        email: email.trim().toLowerCase(),
        callbackURL: redirectParam,
      })

      if (authError) {
        setError(authError.message || "Something went wrong. Please try again.")
        return
      }

      setSuccess(true)
    } catch {
      setError("Unable to connect. Please check your internet and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSessionLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex h-[320px] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Spinner className="size-8" />
            <p className="text-sm text-muted-foreground">Checking session...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircleIcon className="size-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription className="text-base">
            We sent a login link to{" "}
            <strong className="font-semibold text-foreground">{email}</strong>.
            Click the link in the email to sign in instantly.
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
            // Fallback for custom domains (like snapdevio.com)
            const searchTerm = encodeURIComponent("Sign in to Shoptimity")
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
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              setSuccess(false)
              setEmail("")
            }}
          >
            Wait, I'll use a different email
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in to your account</CardTitle>
        <CardDescription>
          Enter your email to get a magic login link. Fast, secure, and
          password-free.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleMagicLink} className="grid gap-4">
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
                <MailIcon className="mr-2" />
                Send magic link
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/plans"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Purchase a license
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

export function LoginClient() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
