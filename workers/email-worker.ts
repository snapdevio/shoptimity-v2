import { type PgBoss, type Job } from "pg-boss"
import { render } from "@react-email/components"

import { MagicLinkEmail } from "@/emails/magic-link"
import { OrderConfirmationEmail } from "@/emails/order-confirmation"
import { LicenseRevokedEmail } from "@/emails/license-revoked"
import { LoginNotificationEmail } from "@/emails/login-notification"
import { TrialEndingEmail } from "@/emails/trial-ending"
import { ConversionConfirmationEmail } from "@/emails/conversion-confirmation"
import { sendEmail } from "@/lib/email"

type MagicLinkProps = {
  magicLinkUrl: string
  expiresInMinutes?: number
}

type OrderConfirmationProps = {
  contactName: string
  email: string
  planName: string
  licenseQuantity: number
  totalAmount: number
  currency: string
  domains?: string[]
}

type LicenseRevokedProps = {
  email: string
  reason: "refund" | "dispute" | "admin_action"
  planName: string
  domainCount: number
}

type LoginNotificationProps = {
  loginUrl: string
}

type TrialEndingProps = {
  contactName: string
  trialEndsAt: string
}

type EmailJobData =
  | { template: "magic-link"; to: string; props: MagicLinkProps }
  | {
      template: "order-confirmation"
      to: string
      props: OrderConfirmationProps
    }
  | { template: "license-revoked"; to: string; props: LicenseRevokedProps }
  | {
      template: "login-notification"
      to: string
      props: LoginNotificationProps
    }
  | {
      template: "trial-ending"
      to: string
      props: TrialEndingProps
    }
  | {
      template: "conversion-confirmation"
      to: string
      props: OrderConfirmationProps
    }

const QUEUE_NAME = "email-delivery"

const SUBJECT_MAP: Record<EmailJobData["template"], string> = {
  "magic-link": "Sign in to Shoptimity",
  "order-confirmation": "Your Shoptimity Order Confirmation",
  "license-revoked": "Your Shoptimity License Has Been Revoked",
  "login-notification": "Sign in to your Shoptimity Account",
  "trial-ending": "Your Shoptimity Trial is Ending Soon",
  "conversion-confirmation": "Your Shoptimity Trial has been Converted!",
}

const PERMANENT_ERRORS = [
  "Invalid email",
  "Missing required",
  "Unknown template",
]

function isPermanentError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return PERMANENT_ERRORS.some((prefix) => message.startsWith(prefix))
}

function renderTemplate(data: EmailJobData): Promise<string> {
  switch (data.template) {
    case "magic-link":
      return render(MagicLinkEmail(data.props))
    case "order-confirmation":
      return render(OrderConfirmationEmail(data.props))
    case "license-revoked":
      return render(LicenseRevokedEmail(data.props))
    case "login-notification":
      return render(LoginNotificationEmail(data.props))
    case "trial-ending":
      return render(TrialEndingEmail(data.props))
    case "conversion-confirmation":
      return render(ConversionConfirmationEmail(data.props))

    default: {
      const _exhaustive: never = data
      throw new Error(
        `Unknown template: ${(_exhaustive as EmailJobData).template}`
      )
    }
  }
}

export async function registerEmailWorker(boss: PgBoss) {
  await boss.createQueue(QUEUE_NAME)
  await boss.work<EmailJobData>(
    QUEUE_NAME,
    { batchSize: 1 },
    async (jobs: Job<EmailJobData>[]) => {
      for (const job of jobs) {
        const { data } = job

        try {
          const html = await renderTemplate(data)
          const subject = SUBJECT_MAP[data.template]

          await sendEmail({
            to: data.to,
            subject,
            html,
          })

          // console.log(
          //   `[email-worker] Sent "${data.template}" email to ${data.to}`
          // )
        } catch (error) {
          if (isPermanentError(error)) {
            console.error(
              `[email-worker] Permanent failure for job ${job.id}:`,
              error
            )
            throw error
          }

          console.error(
            `[email-worker] Transient failure for job ${job.id}, will retry:`,
            error
          )
          throw error
        }
      }
    }
  )

  // console.log(`[email-worker] Subscribed to "${QUEUE_NAME}" queue`)
}
