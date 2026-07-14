import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { AuthLayout } from "@/components/layout/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { otpApi } from "@/api/otp.api"
import { getErrorMessage } from "@/lib/errors"
import {
  resetRequestSchema,
  type ResetRequestFormValues,
} from "@/lib/validation/auth.schemas"

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetRequestFormValues>({ resolver: zodResolver(resetRequestSchema) })

  const onSubmit = async (values: ResetRequestFormValues) => {
    setIsSubmitting(true)
    try {
      await otpApi.resetInitiate(values)
      // Backend silently no-ops for unknown/inactive emails to prevent
      // account enumeration — always show the same success state.
      toast.success("If that email exists, a code is on its way")
      navigate(`/forgot-password/verify?email=${encodeURIComponent(values.email)}`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a code"
      footer={
        <>
          Remembered it?{" "}
          <Link
            to="/login"
            className="font-medium text-neutral-900 underline underline-offset-4"
          >
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending code…" : "Send code"}
        </Button>
      </form>
    </AuthLayout>
  )
}
