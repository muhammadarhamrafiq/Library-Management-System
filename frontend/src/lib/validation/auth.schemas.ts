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

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
})
export type LoginFormValues = z.infer<typeof loginSchema>

export const resetRequestSchema = z.object({
  email: z.string().email("Enter a valid email"),
})
export type ResetRequestFormValues = z.infer<typeof resetRequestSchema>

export const newPasswordSchema = z
  .object({
    new_password: z.string().min(8, "At least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
  })
export type NewPasswordFormValues = z.infer<typeof newPasswordSchema>
