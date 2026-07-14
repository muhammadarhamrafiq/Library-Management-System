import { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
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
  newPasswordSchema,
  type NewPasswordFormValues,
} from "@/lib/validation/auth.schemas"

export default function ForgotPasswordResetPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPasswordFormValues>({ resolver: zodResolver(newPasswordSchema) })

  if (!token) {
    return (
      <AuthLayout
        title="Missing reset token"
        subtitle="Start over to request a new code"
      >
        <Link
          to="/forgot-password"
          className="text-sm font-medium text-neutral-900 underline underline-offset-4"
        >
          Back to reset password
        </Link>
      </AuthLayout>
    )
  }

  const onSubmit = async (values: NewPasswordFormValues) => {
    setIsSubmitting(true)
    try {
      await otpApi.resetConfirm({ token, new_password: values.new_password })
      toast.success("Password updated — log in with your new password")
      navigate("/login", { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err, "That link expired. Start over."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a new password for your account"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="new_password">New password</Label>
          <Input
            id="new_password"
            type="password"
            autoComplete="new-password"
            {...register("new_password")}
          />
          {errors.new_password && (
            <p className="text-sm text-red-600">{errors.new_password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm_password">Confirm password</Label>
          <Input
            id="confirm_password"
            type="password"
            autoComplete="new-password"
            {...register("confirm_password")}
          />
          {errors.confirm_password && (
            <p className="text-sm text-red-600">{errors.confirm_password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthLayout>
  )
}
