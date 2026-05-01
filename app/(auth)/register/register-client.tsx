"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  MailIcon,
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  CheckCircleIcon,
  ArrowRight,
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { authClient } from "@/lib/auth-client"

function getInboxDetails(email: string) {
  const domain = email.split("@")[1]?.toLowerCase()
  if (!domain) return null

  const searchTerm = encodeURIComponent("Verify your Shoptimity account")

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
import { cn } from "@/lib/utils"

function RegisterForm({ className, ...props }: React.ComponentProps<"div">) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const posthog = usePostHog()
  const redirectParam = searchParams.get("redirect") || "/licenses"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState<
    "email" | "google" | null
  >(null)
  const [error, setError] = useState<string | null>(null)
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

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (
      !email.trim() ||
      !password.trim() ||
      !firstName.trim() ||
      !lastName.trim()
    ) {
      setError("Please fill in all fields.")
      return
    }

    setLoadingProvider("email")

    posthog.capture("registration_attempted", {
      email: email.trim().toLowerCase(),
    })

    try {
      const { error: authError } = await authClient.signUp.email({
        email: email.trim().toLowerCase(),
        password,
        name: `${firstName.trim()} ${lastName.trim()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        callbackURL: redirectParam,
      })

      if (authError) {
        setError(authError.message || "Registration failed. Please try again.")
        return
      }

      setSuccess(true)
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
    const inbox = getInboxDetails(email)
    const searchTerm = encodeURIComponent("Verify your Shoptimity account")

    return (
      <div className="animate-in duration-500 zoom-in-95 fade-in">
        <Card className="mx-auto w-full max-w-md overflow-hidden border-border/50 bg-card/50 shadow-2xl backdrop-blur-sm">
          <div className="h-1.5 w-full bg-linear-to-r from-primary/50 via-primary to-primary/50" />
          <CardHeader className="pt-10 text-center">
            <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-primary/10 shadow-inner ring-1 ring-primary/20">
              <MailIcon className="animate-bounce-subtle size-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">
              Check your email
            </CardTitle>
            <CardDescription className="mt-4 px-4 text-base leading-relaxed text-muted-foreground">
              We've sent a magic link to{" "}
              <span className="mt-1 block rounded-lg border border-primary/10 bg-primary/5 px-2 py-1 font-bold break-all text-foreground">
                {email}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pt-2 pb-8">
            <div className="flex flex-col gap-3">
              {inbox ? (
                <Button
                  asChild
                  className="h-12 w-full cursor-pointer rounded-xl bg-primary font-bold shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98]"
                  size="lg"
                >
                  <a
                    href={inbox.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex cursor-pointer items-center justify-center gap-2"
                  >
                    Open {inbox.name}
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    className="h-12 w-full cursor-pointer rounded-xl bg-primary font-bold shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98]"
                    size="lg"
                  >
                    <a
                      href={`https://mail.google.com/mail/u/0/#search/${searchTerm}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex cursor-pointer items-center justify-center gap-2"
                    >
                      <MailIcon className="size-4" />
                      Open Gmail
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 w-full cursor-pointer rounded-xl font-bold transition-all hover:bg-slate-50 active:scale-[0.98]"
                    size="lg"
                  >
                    <a
                      href={`https://outlook.live.com/mail/0/search/results?q=${searchTerm}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex cursor-pointer items-center justify-center gap-2"
                    >
                      <MailIcon className="size-4" />
                      Open Outlook
                    </a>
                  </Button>
                </>
              )}
            </div>

            <div className="mt-8 flex flex-col items-center gap-4 text-center">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="flex size-1.5 rounded-full bg-primary/50" />
                Didn't receive the email? Check your spam folder.
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSuccess(false)
                  setEmail("")
                }}
                className="cursor-pointer text-xs font-bold text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary"
              >
                Use a different email address
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-none p-0 shadow-2xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleRegister} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight">
                  Create your account
                </h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Join Shoptimity today and start building
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

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 rounded-xl"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 rounded-xl"
                  />
                </Field>
              </div>

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
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
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
                <FieldDescription className="text-[10px]">
                  Must be at least 8 characters long.
                </FieldDescription>
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
                  Create Account
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
                      <svg className="size-5" viewBox="0 0 48 48">
                        <path
                          fill="#FFC107"
                          d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                        />
                        <path
                          fill="#FF3D00"
                          d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                        />
                        <path
                          fill="#4CAF50"
                          d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                        />
                        <path
                          fill="#1976D2"
                          d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                  <span className="sr-only">Login with Google</span>
                </Button>
              </Field>

              <FieldDescription className="text-center font-medium">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="cursor-pointer font-bold text-primary underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden md:block">
            <img
              src="/assets/register-img.webp"
              alt="Premium Shopify Visualization"
              className="absolute inset-0 h-full w-full object-contain"
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

export function RegisterClient() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
      <div className="w-full max-w-md md:max-w-5xl">
        <Suspense
          fallback={
            <Card className="overflow-hidden border-none p-0 shadow-2xl">
              <CardContent className="flex h-150 items-center justify-center bg-card">
                <Spinner className="size-8" />
              </CardContent>
            </Card>
          }
        >
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  )
}
