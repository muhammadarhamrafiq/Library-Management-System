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
import { otpSchema, type OtpFormValues } from "@/lib/validation/auth.schemas"

export default function RegisterVerifyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get("email") ?? ""
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormValues>({ resolver: zodResolver(otpSchema) })

  // No email in the URL means they landed here directly — send them back
  // to start over rather than letting them submit against an empty email.
  if (!email) {
    return (
      <AuthLayout
        title="Missing email"
        subtitle="Start registration again to get a new code"
      >
        <Link
          to="/register"
          className="text-sm font-medium text-neutral-900 underline underline-offset-4"
        >
          Back to register
        </Link>
      </AuthLayout>
    )
  }

  const onSubmit = async (values: OtpFormValues) => {
    setIsSubmitting(true)
    try {
      // POST /register/verify returns the created User, not a token —
      // there's no auto-login here, so send them to log in themselves.
      await otpApi.registerVerify({ email, otp: values.otp })
      toast.success("Account created — log in to continue")
      navigate("/login", { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err, "Invalid or expired code."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Enter your code"
      subtitle={`We sent a 6-digit code to ${email}`}
      footer={
        <>
          Wrong email?{" "}
          <Link
            to="/register"
            className="font-medium text-neutral-900 underline underline-offset-4"
          >
            Start over
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="otp">Verification code</Label>
          <Input
            id="otp"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            className="text-center text-lg tracking-[0.5em]"
            {...register("otp")}
          />
          {errors.otp && <p className="text-sm text-red-600">{errors.otp.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Verifying…" : "Verify & create account"}
        </Button>
      </form>
    </AuthLayout>
  )
}
