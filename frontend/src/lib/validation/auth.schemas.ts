import { z } from "zod"

export const registerSchema = z.object({
  full_name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
})
export type RegisterFormValues = z.infer<typeof registerSchema>

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "Enter the 6-digit code")
    .regex(/^\d+$/, "Digits only"),
})
export type OtpFormValues = z.infer<typeof otpSchema>
