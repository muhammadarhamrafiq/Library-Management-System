import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock3,
  Mail,
  ShieldAlert,
  ShieldCheck,
  ShieldUser,
  Users,
  UserCircle2,
} from "lucide-react"

import { statsApi } from "@/api/stats.api"
import { usersApi } from "@/api/users.api"
import { getErrorMessage } from "@/lib/errors"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"
import type { User } from "@/types/user.types"
import type { DailyStatistics } from "@/types/stats.types"

export default function DashboardPage() {
  const role = useAuthStore((state) => state.role)
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<DailyStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(false)

  const canSeeStats = role === "admin" || role === "librarian"

  useEffect(() => {
    let active = true

    const loadDashboard = async () => {
      setIsLoading(true)
      try {
        const me = await usersApi.getMe()
        if (active) setUser(me)
      } catch (error) {
        toast.error(getErrorMessage(error, "Couldn't load your dashboard."))
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadDashboard()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadStats = async () => {
      if (!canSeeStats) {
        setStats(null)
        return
      }

      setIsStatsLoading(true)
      try {
        const dailyStats = await statsApi.getDaily()
        if (active) setStats(dailyStats)
      } catch (error) {
        toast.error(getErrorMessage(error, "Couldn't load dashboard statistics."))
      } finally {
        if (active) setIsStatsLoading(false)
      }
    }

    void loadStats()

    return () => {
      active = false
    }
  }, [canSeeStats])

  return (
    <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">
            {role ? role : "member"} dashboard
          </p>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
                {isLoading ? "Loading your dashboard…" : `Welcome, ${user?.full_name ?? "member"}`}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                {isLoading
                  ? "Fetching your account details."
                  : "Use this space for the essentials: account info, profile edits, and password changes."}
              </p>
            </div>
            <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-sm sm:flex">
              <UserCircle2 className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <p className="mt-2 text-sm text-neutral-900">{user?.email ?? "—"}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <ShieldUser className="h-4 w-4" />
                Role
              </div>
              <p className="mt-2 text-sm text-neutral-900 capitalize">{user?.role ?? role ?? "member"}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <CalendarDays className="h-4 w-4" />
                Joined
              </div>
              <p className="mt-2 text-sm text-neutral-900">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>
        </div>

        {canSeeStats && (
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">
                  Daily statistics
                </p>
                <h2 className="mt-2 text-xl font-semibold text-neutral-900">Today’s snapshot</h2>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Daily stats are available for librarians and admins.
                </p>
              </div>
              <div className="hidden rounded-2xl bg-neutral-950 px-4 py-3 text-white shadow-sm sm:block">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>

            {isStatsLoading ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-24 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-50" />
                ))}
              </div>
            ) : stats ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard icon={<BookOpen className="h-4 w-4" />} label="Books borrowed" value={stats.books_borrowed} />
                <StatCard icon={<ShieldCheck className="h-4 w-4" />} label="Books returned" value={stats.books_returned} />
                <StatCard icon={<Clock3 className="h-4 w-4" />} label="Active loans" value={stats.active_loans} />
                <StatCard icon={<ShieldAlert className="h-4 w-4" />} label="Overdue loans" value={stats.overdue_loans} />
                <StatCard icon={<Users className="h-4 w-4" />} label="Active members" value={stats.active_members} />
                <StatCard
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Snapshot date"
                  value={new Date(stats.stat_date).toLocaleDateString()}
                />
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
                No statistics available yet.
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="rounded-3xl border border-neutral-200 bg-neutral-950 p-6 text-white shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">
          Quick actions
        </p>
        <h2 className="mt-3 text-xl font-semibold">Manage your account</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-300">
          Update your profile details or change your password from the profile page.
        </p>

        <div className="mt-6 space-y-3">
          <Link
            to="/profile"
            className={cn(
              "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
            )}
          >
            Open profile
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
            Keep your contact details current so account notifications reach you.
          </div>
        </div>
      </aside>
    </section>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900">{value}</p>
    </div>
  )
}
