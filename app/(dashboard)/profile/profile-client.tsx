"use client"

import { useState, useTransition } from "react"
import { UserIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { updateName } from "@/actions/profile"
import { formatDate } from "@/lib/format"

interface ProfileClientProps {
  name: string
  email: string
  createdAt: string
}

export function ProfileClient({
  name: initialName,
  email,
  createdAt,
}: ProfileClientProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await updateName(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess("Profile updated successfully.")
      }
    })
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserIcon className="size-5 text-muted-foreground" />
            <CardTitle>Account Information</CardTitle>
          </div>
          <CardDescription>Your account details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Email address</Label>
            <Input value={email} disabled readOnly />
            <p className="text-xs text-muted-foreground">
              Your email address cannot be changed.
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Member since</Label>
            <p className="text-sm text-muted-foreground">
              {formatDate(createdAt, "MMMM d, yyyy")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display Name</CardTitle>
          <CardDescription>Update your display name.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircleIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4">
              <CheckCircleIcon />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <form action={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                defaultValue={initialName}
                required
                disabled={isPending}
              />
            </div>
            <div>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Spinner className="mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
