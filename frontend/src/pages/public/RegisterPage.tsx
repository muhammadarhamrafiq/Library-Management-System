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
import { registerSchema, type RegisterFormValues } from "@/lib/validation/auth.schemas"

export default function RegisterPage() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (values: RegisterFormValues) => {
    
    setIsSubmitting(true)

    try {
      await otpApi.registerInitiate(values)
      toast.success("Code sent — check your email")
      navigate(`/register/verify?email=${encodeURIComponent(values.email)}`)
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't send the code. Try again."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="We'll email you a code to verify it's you"
      footer={
        <>
          Already have an account?{" "}
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
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" autoComplete="name" {...register("full_name")} />
          {errors.full_name && (
            <p className="text-sm text-red-600">{errors.full_name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending code…" : "Send verification code"}
        </Button>
      </form>
    </AuthLayout>
  )
}
