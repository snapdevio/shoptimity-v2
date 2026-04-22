"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Mail, MapPin, Send, Loader2, CheckCircle } from "lucide-react"

const SUBJECT_OPTIONS = [
  "General Inquiry",
  "Technical Support",
  "Billing & Payments",
  "Feature Request",
  "Content Feedback",
  "Security Report",
  "Other (Custom)",
]

export function ContactClient() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subjectOption: "",
    customSubject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function validate() {
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) errors.name = "Name is required"
    if (!formData.email.trim()) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }
    if (!formData.subjectOption) {
      errors.subjectOption = "Please select a subject"
    } else if (
      formData.subjectOption === "Other (Custom)" &&
      !formData.customSubject.trim()
    ) {
      errors.customSubject = "Please enter your subject"
    }
    if (!formData.message.trim()) errors.message = "Message is required"
    return errors
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const errors = validate()
    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    try {
      const finalSubject =
        formData.subjectOption === "Other (Custom)"
          ? formData.customSubject.trim()
          : formData.subjectOption

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: finalSubject,
          message: formData.message.trim(),
        }),
      })

      const result = await res.json().catch(() => ({}))

      if (res.ok && result.success) {
        setIsSubmitted(true)
        setFormData({
          name: "",
          email: "",
          subjectOption: "",
          customSubject: "",
          message: "",
        })
      } else {
        if (result.details && typeof result.details === "object") {
          // Flatten field errors from Zod
          const flattenedErrors: Record<string, string> = {}
          const details = result.details as {
            fieldErrors: Record<string, string[]>
          }
          if (details.fieldErrors) {
            Object.entries(details.fieldErrors).forEach(([key, val]) => {
              flattenedErrors[key] = val[0]
            })
            setFieldErrors(flattenedErrors)
          } else {
            setError(
              result.error || "Validation failed. Please check your inputs."
            )
          }
        } else {
          setError(result.error || "An unexpected error occurred.")
        }
      }
    } catch (err) {
      setError("Failed to send message. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-base-100 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            Get in Touch
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Have a question or need help? We would love to hear from you. Send
            us a message and we will respond as soon as possible.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Send a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we will get back to you within 24
                  hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle className="size-7 text-primary" />
                    </div>
                    <h3 className="mt-4 font-heading text-lg font-semibold">
                      Message Sent
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Thank you for reaching out. We will get back to you
                      shortly.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-6"
                      onClick={() => setIsSubmitted(false)}
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                      <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {error}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        aria-invalid={!!fieldErrors.name}
                      />
                      {fieldErrors.name && (
                        <p className="text-sm text-destructive">
                          {fieldErrors.name}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        aria-invalid={!!fieldErrors.email}
                      />
                      {fieldErrors.email && (
                        <p className="text-sm text-destructive">
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subjectOption">
                        Subject <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.subjectOption}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            subjectOption: value || "",
                          }))
                        }
                      >
                        <SelectTrigger
                          id="subjectOption"
                          aria-invalid={!!fieldErrors.subjectOption}
                          className="w-full"
                        >
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECT_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.subjectOption && (
                        <p className="text-sm text-destructive">
                          {fieldErrors.subjectOption}
                        </p>
                      )}
                    </div>

                    {formData.subjectOption === "Other (Custom)" && (
                      <div className="animate-in space-y-2 duration-300 fade-in slide-in-from-top-2">
                        <Label htmlFor="customSubject">
                          Custom Subject{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="customSubject"
                          value={formData.customSubject}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              customSubject: e.target.value,
                            }))
                          }
                          placeholder="What's this about?"
                          aria-invalid={!!fieldErrors.customSubject}
                        />
                        {fieldErrors.customSubject && (
                          <p className="text-sm text-destructive">
                            {fieldErrors.customSubject}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="message">
                        Message <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="How can we help you?"
                        rows={5}
                        aria-invalid={!!fieldErrors.message}
                      />
                      {fieldErrors.message && (
                        <p className="text-sm text-destructive">
                          {fieldErrors.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2
                            className="animate-spin"
                            data-icon="inline-start"
                          />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send data-icon="inline-start" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Card className="transition-colors hover:border-primary/50">
              <CardHeader>
                <a
                  href="mailto:support@shoptimity.com"
                  className="group flex items-center gap-3"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Mail className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Email</CardTitle>
                    <CardDescription className="transition-colors group-hover:text-primary">
                      support@shoptimity.com
                    </CardDescription>
                  </div>
                </a>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="size-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Location</CardTitle>
                    <CardDescription>United States</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardContent>
                <h3 className="font-heading font-semibold">
                  Frequently Asked Questions
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <li>
                    <strong className="text-foreground">
                      What kind of support is included?
                    </strong>
                    <br />
                    Every Shoptimity purchase comes with dedicated support via
                    live chat, email, and our contact page.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Is Shoptimity easy to set up for beginners?
                    </strong>
                    <br />
                    Absolutely. Our "3-step setup" allows anyone to transfer
                    their content and scale their store in minutes without any
                    coding knowledge.
                  </li>
                  <li>
                    <strong className="text-foreground">
                      Can I use Shoptimity on multiple stores?
                    </strong>
                    <br />
                    This depends on the license you purchase. Each standard
                    license is valid for a single Shopify store, with bundles
                    available for multiple brands.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
