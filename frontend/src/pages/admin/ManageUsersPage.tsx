import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LockKeyhole,
  Search,
  ShieldCheck,
  ShieldOff,
  Users,
} from "lucide-react"

import { usersApi } from "@/api/users.api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/errors"
import { useAuthStore } from "@/stores/authStore"
import type { Role } from "@/types/auth.types"
import type { User } from "@/types/user.types"

const PAGE_SIZE = 8

const ROLE_OPTIONS: Array<{ label: string; value: Role | "" }> = [
  { label: "All roles", value: "" },
  { label: "Admin", value: "admin" },
  { label: "Librarian", value: "librarian" },
  { label: "Member", value: "member" },
]

const ACTIVE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "true" },
  { label: "Inactive", value: "false" },
]

function roleLabel(role: Role) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function statusClasses(isActive: boolean) {
  return isActive
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-neutral-100 text-neutral-500 border-neutral-200"
}

export default function ManageUsersPage() {
  const currentUserId = useAuthStore((state) => state.userId)
  const [users, setUsers] = useState<User[]>([])
  const [draftSearch, setDraftSearch] = useState("")
  const [draftRole, setDraftRole] = useState<Role | "">("")
  const [draftActive, setDraftActive] = useState("")
  const [draftSortBy, setDraftSortBy] = useState<"id" | "full_name" | "email" | "created_at" | "is_active">("created_at")
  const [draftSortOrder, setDraftSortOrder] = useState<"asc" | "desc">("desc")
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<Role | "">("")
  const [activeFilter, setActiveFilter] = useState("")
  const [sortBy, setSortBy] = useState<"id" | "full_name" | "email" | "created_at" | "is_active">("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingUserId, setIsUpdatingUserId] = useState<number | null>(null)

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true)
      try {
        const response = await usersApi.list({
          search_query: searchQuery || undefined,
          role: roleFilter || undefined,
          is_active: activeFilter === "true" ? true : activeFilter === "false" ? false : undefined,
          sortBy,
          sortOrder,
          skip: (page - 1) * PAGE_SIZE,
          limit: PAGE_SIZE,
        })

        setUsers(response.data)
        setTotal(response.total)
        setTotalPages(response.total_pages)
      } catch (error) {
        toast.error(getErrorMessage(error, "Couldn't load users."))
      } finally {
        setIsLoading(false)
      }
    }

    void loadUsers()
  }, [activeFilter, page, roleFilter, searchQuery, sortBy, sortOrder])

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSearchQuery(draftSearch)
    setRoleFilter(draftRole)
    setActiveFilter(draftActive)
    setSortBy(draftSortBy)
    setSortOrder(draftSortOrder)
    setPage(1)
  }

  const refreshUsers = async () => {
    const response = await usersApi.list({
      search_query: searchQuery || undefined,
      role: roleFilter || undefined,
      is_active: activeFilter === "true" ? true : activeFilter === "false" ? false : undefined,
      sortBy,
      sortOrder,
      skip: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    })

    setUsers(response.data)
    setTotal(response.total)
    setTotalPages(response.total_pages)
  }

  const updateUser = async (userId: number, action: () => Promise<User>, successMessage: string) => {
    setIsUpdatingUserId(userId)
    try {
      await action()
      toast.success(successMessage)
      await refreshUsers()
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't update this user."))
    } finally {
      setIsUpdatingUserId(null)
    }
  }

  const changeRole = async (userId: number, role: Role) => {
    await updateUser(userId, () => usersApi.changeRole(userId, { role }), "User role updated")
  }

  return (
    <section className="space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">Administration</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">Manage users</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
          Search, sort, activate/deactivate, and change roles for user accounts.
        </p>

        <form onSubmit={applyFilters} className="mt-6 grid gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 lg:grid-cols-4">
          <div className="space-y-1.5 lg:col-span-2">
            <label className="text-sm font-medium text-neutral-900">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                className="pl-9"
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
                placeholder="Search by name or email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Role</label>
            <select
              className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900"
              value={draftRole}
              onChange={(event) => setDraftRole(event.target.value as Role | "")}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Status</label>
            <select
              className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900"
              value={draftActive}
              onChange={(event) => setDraftActive(event.target.value)}
            >
              {ACTIVE_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Sort by</label>
            <select
              className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900"
              value={draftSortBy}
              onChange={(event) =>
                setDraftSortBy(event.target.value as "id" | "full_name" | "email" | "created_at" | "is_active")
              }
            >
              <option value="created_at">Created at</option>
              <option value="id">ID</option>
              <option value="full_name">Full name</option>
              <option value="email">Email</option>
              <option value="is_active">Status</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Sort order</label>
            <select
              className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900"
              value={draftSortOrder}
              onChange={(event) => setDraftSortOrder(event.target.value as "asc" | "desc")}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <div className="lg:col-span-4">
            <Button type="submit" className="w-full sm:w-auto">
              Apply filters
            </Button>
          </div>
        </form>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-neutral-500">
        <p>
          {total} user{total === 1 ? "" : "s"}
        </p>
        <p>
          Page {page} of {Math.max(totalPages, 1)}
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-neutral-400" />
          <p className="mt-3 text-sm text-neutral-500">Loading users…</p>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <Users className="mx-auto h-8 w-8 text-neutral-300" />
          <h2 className="mt-3 text-lg font-semibold text-neutral-900">No users found</h2>
          <p className="mt-2 text-sm text-neutral-500">Try adjusting the filters or sort order.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {users.map((user) => {
            const isCurrentUser = currentUserId === user.id

            return (
              <article key={user.id} className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">User #{user.id}</p>
                    <h2 className="mt-2 text-lg font-semibold text-neutral-900">{user.full_name}</h2>
                    <p className="mt-1 text-sm text-neutral-500">{user.email}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClasses(user.is_active)}`}>
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-neutral-600 sm:grid-cols-2">
                  <p>Role: {roleLabel(user.role)}</p>
                  <p>Created: {new Date(user.created_at).toLocaleDateString()}</p>
                  <p>Updated: {new Date(user.updated_at).toLocaleDateString()}</p>
                  <p>{isCurrentUser ? "Current admin account" : "Admin-managed account"}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
                    <LockKeyhole className="h-4 w-4 text-neutral-500" />
                    <select
                      className="bg-transparent text-sm text-neutral-900 outline-none"
                      value={user.role}
                      onChange={(event) => void changeRole(user.id, event.target.value as Role)}
                      disabled={isUpdatingUserId === user.id}
                    >
                      <option value="admin">Admin</option>
                      <option value="librarian">Librarian</option>
                      <option value="member">Member</option>
                    </select>
                  </div>

                  {user.is_active ? (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() =>
                        void updateUser(user.id, () => usersApi.deactivate(user.id), "User deactivated")
                      }
                      disabled={isUpdatingUserId === user.id}
                    >
                      <ShieldOff className="h-4 w-4" />
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() =>
                        void updateUser(user.id, () => usersApi.activate(user.id), "User activated")
                      }
                      disabled={isUpdatingUserId === user.id}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Activate
                    </Button>
                  )}

                  {isUpdatingUserId === user.id && (
                    <span className="inline-flex items-center gap-2 text-sm text-neutral-500">
                      <BadgeCheck className="h-4 w-4" />
                      Updating…
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-3xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
        <Button type="button" variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isLoading}>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <p className="text-sm text-neutral-500">
          Page {page} of {Math.max(totalPages, 1)}
        </p>
        <Button type="button" variant="outline" onClick={() => setPage((current) => current + 1)} disabled={page >= totalPages || isLoading}>
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  )
}
