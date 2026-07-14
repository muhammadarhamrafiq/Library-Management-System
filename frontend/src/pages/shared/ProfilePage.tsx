import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { KeyRound, Loader2, Save, UserPen } from "lucide-react"

import { usersApi } from "@/api/users.api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getErrorMessage } from "@/lib/errors"
import { useAuthStore } from "@/stores/authStore"
import {
  changePasswordSchema,
  profileUpdateSchema,
  type ChangePasswordFormValues,
  type ProfileUpdateFormValues,
} from "@/lib/validation/auth.schemas"
import type { User } from "@/types/user.types"

export default function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [isProfileSaving, setIsProfileSaving] = useState(false)
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const logout = useAuthStore((state) => state.logout)

  const profileForm = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: { full_name: "", email: "" },
  })

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  })

  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      setIsProfileLoading(true)
      try {
        const me = await usersApi.getMe()
        if (!active) return

        setUser(me)
        profileForm.reset({ full_name: me.full_name, email: me.email })
      } catch (error) {
        toast.error(getErrorMessage(error, "Couldn't load your profile."))
      } finally {
        if (active) setIsProfileLoading(false)
      }
    }

    void loadProfile()

    return () => {
      active = false
    }
  }, [profileForm])

  const onSaveProfile = async (values: ProfileUpdateFormValues) => {
    setIsProfileSaving(true)
    try {
      const updatedUser = await usersApi.updateMe(values)
      setUser(updatedUser)
      profileForm.reset({ full_name: updatedUser.full_name, email: updatedUser.email })
      toast.success("Profile updated")
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't update your profile."))
    } finally {
      setIsProfileSaving(false)
    }
  }

  const onChangePassword = async (values: ChangePasswordFormValues) => {
    setIsPasswordSaving(true)
    try {
      await usersApi.changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      })
      passwordForm.reset()
      toast.success("Password updated")
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't change your password."))
    } finally {
      setIsPasswordSaving(false)
    }
  }

  const onDeactivateAccount = async () => {
    const confirmed = window.confirm(
      "Deactivate your account? You will lose access immediately and need an admin to reactivate it."
    )

    if (!confirmed) return

    setIsDeactivating(true)
    try {
      await usersApi.deactivateMe()
      toast.success("Your account has been deactivated")
      logout()
      navigate("/login", { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't deactivate your account."))
    } finally {
      setIsDeactivating(false)
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-900 text-white">
              <UserPen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Profile</h1>
              <p className="text-sm text-neutral-500">View and update your account details.</p>
            </div>
          </div>

          {isProfileLoading ? (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading profile…
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Account</p>
                <p className="mt-2 text-sm font-medium text-neutral-900">#{user?.id ?? "—"}</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Role</p>
                <p className="mt-2 text-sm font-medium capitalize text-neutral-900">{user?.role ?? "—"}</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-neutral-400">Status</p>
                <p className="mt-2 text-sm font-medium text-neutral-900">{user?.is_active ? "Active" : "Inactive"}</p>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={profileForm.handleSubmit(onSaveProfile)}
          className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
          noValidate
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-900">
              <Save className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Update profile</h2>
              <p className="text-sm text-neutral-500">Change your name and email address.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" autoComplete="name" {...profileForm.register("full_name")} />
              {profileForm.formState.errors.full_name && (
                <p className="text-sm text-red-600">{profileForm.formState.errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...profileForm.register("email")} />
              {profileForm.formState.errors.email && (
                <p className="text-sm text-red-600">{profileForm.formState.errors.email.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isProfileSaving || isProfileLoading}>
              {isProfileSaving ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>
      </div>

      <aside className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-900">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Change password</h2>
            <p className="text-sm text-neutral-500">Use a strong new password you have not reused before.</p>
          </div>
        </div>

        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="mt-6 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="current_password">Current password</Label>
            <Input
              id="current_password"
              type="password"
              autoComplete="current-password"
              {...passwordForm.register("current_password")}
            />
            {passwordForm.formState.errors.current_password && (
              <p className="text-sm text-red-600">{passwordForm.formState.errors.current_password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new_password">New password</Label>
            <Input
              id="new_password"
              type="password"
              autoComplete="new-password"
              {...passwordForm.register("new_password")}
            />
            {passwordForm.formState.errors.new_password && (
              <p className="text-sm text-red-600">{passwordForm.formState.errors.new_password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">Confirm password</Label>
            <Input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              {...passwordForm.register("confirm_password")}
            />
            {passwordForm.formState.errors.confirm_password && (
              <p className="text-sm text-red-600">{passwordForm.formState.errors.confirm_password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPasswordSaving || isProfileLoading}>
            {isPasswordSaving ? "Updating…" : "Change password"}
          </Button>
        </form>

        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
          <h3 className="text-sm font-semibold text-red-900">Deactivate account</h3>
          <p className="mt-1 text-sm leading-6 text-red-700">
            This will deactivate your account and remove access until it is reactivated.
          </p>
          <Button
            type="button"
            variant="destructive"
            className="mt-4 w-full"
            onClick={() => void onDeactivateAccount()}
            disabled={isDeactivating || isProfileLoading || isProfileSaving || isPasswordSaving}
          >
            {isDeactivating ? "Deactivating…" : "Deactivate account"}
          </Button>
        </div>
      </aside>
    </section>
  )
}
