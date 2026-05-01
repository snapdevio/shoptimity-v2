"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  AlertCircleIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react"
import Link from "next/link"
import { usePostHog } from "posthog-js/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"

function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const posthog = usePostHog()
  const errorParam = searchParams.get("error")
  const redirectParam = searchParams.get("redirect") || "/licenses"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState<
    "email" | "google" | null
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

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.")
      return
    }

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

  async function handleSocialLogin(provider: "google") {
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
      <div className="flex h-100 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Spinner className="size-8" />
          <p className="text-sm text-muted-foreground">Checking session...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex flex-col gap-6 py-10 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircleIcon className="size-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-balance text-muted-foreground">
            We sent a login link to{" "}
            <strong className="font-semibold text-foreground">{email}</strong>.
          </p>
        </div>
        {(() => {
          const inbox = getInboxDetails(email)
          if (inbox) {
            return (
              <Button asChild className="w-full rounded-xl" size="lg">
                <a
                  href={inbox.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  Go to {inbox.name}
                </a>
              </Button>
            )
          }
          return (
            <div className="flex flex-col gap-3">
              <Button asChild className="w-full rounded-xl" size="lg">
                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  Open Gmail
                </a>
              </Button>
            </div>
          )
        })()}
        <Button
          variant="link"
          size="sm"
          onClick={() => {
            setSuccess(false)
            setEmail("")
          }}
        >
          Use a different email
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-none p-0 shadow-2xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSignIn} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Login to your Shoptimity account
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircleIcon className="size-4" />
                  <AlertDescription className="text-xs">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                  className="h-11 rounded-xl"
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto cursor-pointer text-sm underline-offset-2 hover:text-primary hover:underline"
                  >
                    Forgot your password?
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
                    className="h-11 rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </button>
                </div>
              </Field>
              <Field>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-11 w-full cursor-pointer rounded-xl bg-primary font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  {loadingProvider === "email" ? (
                    <Spinner className="mr-2" />
                  ) : null}
                  Login
                </Button>
              </Field>
              <FieldSeparator className="text-xs font-medium text-muted-foreground/60 *:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Field>
                <Button
                  variant="outline"
                  type="button"
                  disabled={isLoading}
                  className="h-11 w-full cursor-pointer rounded-xl"
                  onClick={() => handleSocialLogin("google")}
                >
                  {loadingProvider === "google" ? (
                    <Spinner />
                  ) : (
                    <>
                      <svg
                        className="size-5"
                        xmlns="http://www.w3.org/2000/svg"
                        x="0px"
                        y="0px"
                        width="100"
                        height="100"
                        viewBox="0 0 48 48"
                      >
                        <path
                          fill="#FFC107"
                          d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                        ></path>
                        <path
                          fill="#FF3D00"
                          d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                        ></path>
                        <path
                          fill="#4CAF50"
                          d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                        ></path>
                        <path
                          fill="#1976D2"
                          d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                        ></path>
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                  <span className="sr-only">Login with Google</span>
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="cursor-pointer font-bold text-primary underline-offset-4 hover:underline"
                >
                  Sign up
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden md:block">
            <img
              src="/assets/login-img.webp"
              alt="Premium Shopify Visualization"
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* <div className="absolute inset-0 bg-linear-to-t from-zinc-950/20 via-transparent to-zinc-950/20" /> */}
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center text-[11px]">
        By clicking continue, you agree to our{" "}
        <Link
          href="/terms"
          className="cursor-pointer underline underline-offset-4 transition-colors hover:text-primary"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy-policy"
          className="cursor-pointer underline underline-offset-4 transition-colors hover:text-primary"
        >
          Privacy Policy
        </Link>
        .
      </FieldDescription>
    </div>
  )
}

export function LoginClient() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Suspense
          fallback={
            <Card className="overflow-hidden border-none p-0 shadow-2xl">
              <CardContent className="flex h-125 items-center justify-center bg-card">
                <Spinner className="size-8" />
              </CardContent>
            </Card>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
