import { z } from "zod"

export const checkoutSchema = z.object({
  email: z.email("Please enter a valid email address"),
  contactName: z.string().min(1, "Contact name is required").max(255),
  planId: z.uuid("Invalid plan ID"),
  licenseQuantity: z
    .number()
    .int("License quantity must be a whole number")
    .min(1, "At least one license is required"),
  domains: z.array(z.string()).optional(),
})

export type CheckoutInput = z.infer<typeof checkoutSchema>
