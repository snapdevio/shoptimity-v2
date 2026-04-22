import { PostHog } from "posthog-node"

let posthogClient: PostHog | null = null

export function getPostHog() {
  if (
    !posthogClient &&
    process.env.NEXT_PUBLIC_POSTHOG_KEY &&
    process.env.NODE_ENV === "production"
  ) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      // Flush immediately in development/serverless to ensure events are sent
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return posthogClient
}
