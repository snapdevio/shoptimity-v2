import { z } from "zod"

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
})

export type LoginInput = z.infer<typeof loginSchema>

export const magicLinkVerifySchema = z.object({
  token: z.string().min(1, "Token is required"),
})

export type MagicLinkVerifyInput = z.infer<typeof magicLinkVerifySchema>
