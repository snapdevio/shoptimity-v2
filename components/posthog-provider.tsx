"use client"

import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import dynamic from "next/dynamic"

import { useEffect } from "react"
import { authClient } from "@/lib/auth-client"

const PostHogPageView = dynamic(() => import("./posthog-page-view"), {
  ssr: false,
})

function PostHogIdentify() {
  const { data: session } = authClient.useSession()

  useEffect(() => {
    if (session?.user) {
      posthog.identify(session.user.email, {
        email: session.user.email,
        name: session.user.name,
      })
    } else {
      posthog.reset()
    }
  }, [session])

  return null
}

const hasPostHogKey = !!process.env.NEXT_PUBLIC_POSTHOG_KEY

if (typeof window !== "undefined" && hasPostHogKey) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    person_profiles: "always",
    capture_pageview: false,
    // Disable tracking in non-production environments unless specifically enabled
    disable_session_recording: process.env.NODE_ENV !== "production",
    autocapture: process.env.NODE_ENV === "production",
  })
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  if (!hasPostHogKey) {
    return <>{children}</>
  }

  return (
    <PostHogProvider client={posthog}>
      <PostHogPageView />
      <PostHogIdentify />
      {children}
    </PostHogProvider>
  )
}
