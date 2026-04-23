"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  UserPlusIcon,
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  CheckCircleIcon,
  MailIcon,
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

function RegisterForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const posthog = usePostHog()
  const redirectParam = searchParams.get("redirect") || "/licenses"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
    setIsLoading(true)

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
      setIsLoading(false)
    }
  }

  if (isSessionLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex h-[400px] items-center justify-center">
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
            We sent a verification link to{" "}
            <strong className="font-semibold text-foreground">{email}</strong>.
            Click the link in the email to activate your account.
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
            const searchTerm = encodeURIComponent(
              "Verify your Shoptimity account"
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
          <p className="text-sm text-muted-foreground">
            Didn't receive the email? Check your spam folder.
          </p>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Enter your details below to create your account and get started.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleRegister} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>
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
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
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
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters long.
            </p>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Spinner className="mr-2" />
                Creating account...
              </>
            ) : (
              <>
                <UserPlusIcon className="mr-2 size-4" />
                Create Account
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

export function RegisterClient() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      }
    >
      <RegisterForm />
    </Suspense>
  )
}
