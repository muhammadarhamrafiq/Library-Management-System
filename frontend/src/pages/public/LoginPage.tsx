import { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { AuthLayout } from "@/components/layout/AuthLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authApi } from "@/api/auth.api"
import { useAuthStore } from "@/stores/authStore"
import { getErrorMessage } from "@/lib/errors"
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth.schemas"

interface LocationState {
  from?: { pathname: string }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sessionExpired =
    new URLSearchParams(location.search).get("sessionExpired") === "true"

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true)
    try {
      const { access_token } = await authApi.login(values)
      login(access_token)
      const state = location.state as LocationState | null
      const redirectTo = state?.from?.pathname ?? "/dashboard"
      navigate(redirectTo, { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err, "Invalid email or password."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Log in"
      subtitle="Welcome back"
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-neutral-900 underline underline-offset-4"
          >
            Register
          </Link>
        </>
      }
    >
      {sessionExpired && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Your session expired. Please log in again.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-sm text-neutral-500 underline underline-offset-4 hover:text-neutral-900"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>
    </AuthLayout>
  )
}
