import nodemailer, { type Transporter } from "nodemailer"
import { env } from "@/validators/env"

let _transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  }
  return _transporter
}

export interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const transporter = getTransporter()

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "noreply@shoptimity.com",
    to: params.to,
    subject: params.subject,
    html: params.html,
  })
}
