"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  MailIcon,
  LockIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react"
import Link from "next/link"
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
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState<
    "email" | "google" | "microsoft" | null
  >(null)
  const [error, setError] = useState<string | null>(
    errorParam
      ? (ERROR_MESSAGES[errorParam] ?? "An unexpected error occurred.")
      : null
  )
  const [success, setSuccess] = useState(false)

  const isLoading = loadingProvider !== null

  const { data: session, isPending: isSessionLoading } = authClient.useSession()

  useEffect(() => {
    if (session?.user.emailVerified) {
      // @ts-ignore
      const role = session.user.role || "user"
      if (role === "admin" && redirectParam === "/licenses") {
        router.push("/admin")
      } else {
        router.push(redirectParam)
      }
    }
  }, [session, router, redirectParam])

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoadingProvider("email")

    posthog.capture("login_attempted", {
      email: email.trim().toLowerCase(),
    })

    try {
      const { error: authError } = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
        callbackURL: redirectParam,
      })

      if (authError) {
        if (authError.code === "EMAIL_NOT_VERIFIED") {
          setError(
            "Your email is not verified. Please check your inbox for the verification link."
          )
        } else {
          setError(authError.message || "Invalid email or password.")
        }
        return
      }

      // Successful login will be handled by the useEffect session check
    } catch {
      setError("Unable to connect. Please check your internet and try again.")
    } finally {
      setLoadingProvider(null)
    }
  }

  async function handleSocialLogin(provider: "google" | "microsoft") {
    setError(null)
    setLoadingProvider(provider)
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: redirectParam,
      })
    } catch {
      setError(`Failed to sign in with ${provider}. Please try again.`)
      setLoadingProvider(null)
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
          Choose your preferred way to sign in to Shoptimity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSignIn} className="grid gap-4">
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
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {loadingProvider === "email" ? (
              <>
                <Spinner className="mr-2" />
                Signing in...
              </>
            ) : (
              <>
                <LockIcon className="mr-2 size-4" />
                Sign In
              </>
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Button
            variant="outline"
            onClick={() => handleSocialLogin("google")}
            disabled={isLoading}
            className="w-full"
          >
            {loadingProvider === "google" ? (
              <Spinner className="mr-2" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Google
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSocialLogin("microsoft")}
            disabled={isLoading}
            className="w-full"
          >
            {loadingProvider === "microsoft" ? (
              <Spinner className="mr-2" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7fbb00" />
                <rect x="1" y="11" width="9" height="9" fill="#00a1f1" />
                <rect x="11" y="11" width="9" height="9" fill="#ffbb00" />
              </svg>
            )}
            Microsoft
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-center gap-1 text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Sign up
        </Link>
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
