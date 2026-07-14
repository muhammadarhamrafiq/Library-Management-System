import { useEffect, useState, type ReactNode } from "react"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  ClipboardList,
  BookOpenText,
  LayoutDashboard,
  LibraryBig,
  LogOut,
  Menu,
  PanelLeftClose,
  UserCircle2,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"
import type { Role } from "@/types/auth.types"

type NavItem = {
  label: string
  href: string
  icon: ReactNode
}

type NavGroup = {
  title: string
  roles?: Role[]
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: "Book catalogue", href: "/books", icon: <BookOpenText className="h-4 w-4" /> },
      { label: "Profile", href: "/profile", icon: <UserCircle2 className="h-4 w-4" /> },
    ],
  },
  {
    title: "Member",
    roles: ["member"],
    items: [{ label: "My loans", href: "/my-loans", icon: <ClipboardList className="h-4 w-4" /> }],
  },
  {
    title: "Library Ops",
    roles: ["librarian", "admin"],
    items: [
      { label: "Manage books", href: "/manage/books", icon: <LibraryBig className="h-4 w-4" /> },
      { label: "Deleted books", href: "/manage/books/deleted", icon: <LibraryBig className="h-4 w-4" /> },
      { label: "Manage loans", href: "/manage/loans", icon: <ClipboardList className="h-4 w-4" /> },
    ],
  },
  {
    title: "Administration",
    roles: ["admin"],
    items: [{ label: "Manage users", href: "/manage/users", icon: <Users className="h-4 w-4" /> }],
  },
]

function getRoleLabel(role: Role | null) {
  if (!role) return "Unknown role"
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export function DashboardShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const role = useAuthStore((state) => state.role)
  const userId = useAuthStore((state) => state.userId)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  const visibleGroups = NAV_GROUPS.filter(
    (group) => !group.roles || (role ? group.roles.includes(role) : false)
  )

  const currentTitle =
    visibleGroups
      .flatMap((group) => group.items)
      .find((item) => location.pathname === item.href)?.label ?? "Dashboard"

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(23,23,23,0.08),_transparent_35%),linear-gradient(180deg,_#fafafa_0%,_#f5f5f5_100%)] text-neutral-900">
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(135deg,_rgba(38,38,38,0.08),_transparent_60%)]" />
      <div className="relative flex min-h-screen">
        <aside className="hidden w-80 shrink-0 border-r border-neutral-200/80 bg-white/90 backdrop-blur xl:flex xl:flex-col">
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-sm shadow-neutral-900/20">
                <LibraryBig className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">Library</p>
                <p className="text-xs text-neutral-500">Role-aware shell</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 xl:hidden"
              aria-label="Close navigation"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            <div className="mb-5 rounded-2xl border border-neutral-200 bg-neutral-950 px-4 py-4 text-white shadow-lg shadow-neutral-950/10">
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Signed in</p>
              <p className="mt-2 text-sm font-medium">{getRoleLabel(role)}</p>
              <p className="mt-1 text-xs text-neutral-400">Account #{userId ?? "—"}</p>
            </div>

            <nav className="space-y-5">
              {visibleGroups.map((group) => (
                <section key={group.title}>
                  <p className="px-3 text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">
                    {group.title}
                  </p>
                  <div className="mt-2 space-y-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        end
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                            isActive
                              ? "bg-neutral-900 text-white shadow-sm shadow-neutral-900/10"
                              : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                          )
                        }
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </section>
              ))}
            </nav>
          </div>

          <div className="border-t border-neutral-200 p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </aside>

        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 xl:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-neutral-950/50"
              aria-label="Close navigation overlay"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-[86vw] max-w-sm flex-col border-r border-neutral-200 bg-white shadow-2xl shadow-neutral-950/20">
              <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
                <Link to="/dashboard" className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-900 text-white">
                    <LibraryBig className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">Library</p>
                    <p className="text-xs text-neutral-500">Role-aware shell</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                  aria-label="Close navigation"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-5">
                <div className="mb-5 rounded-2xl border border-neutral-200 bg-neutral-950 px-4 py-4 text-white shadow-lg shadow-neutral-950/10">
                  <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">Signed in</p>
                  <p className="mt-2 text-sm font-medium">{getRoleLabel(role)}</p>
                  <p className="mt-1 text-xs text-neutral-400">Account #{userId ?? "—"}</p>
                </div>

                <nav className="space-y-5">
                  {visibleGroups.map((group) => (
                    <section key={group.title}>
                      <p className="px-3 text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">
                        {group.title}
                      </p>
                      <div className="mt-2 space-y-1">
                        {group.items.map((item) => (
                          <NavLink
                            key={item.href}
                            to={item.href}
                            end
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                                isActive
                                  ? "bg-neutral-900 text-white shadow-sm shadow-neutral-900/10"
                                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                              )
                            }
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    </section>
                  ))}
                </nav>
              </div>

              <div className="border-t border-neutral-200 p-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col xl:border-l xl:border-neutral-200/80">
          <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white p-2 text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 xl:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-neutral-400">
                    {getRoleLabel(role)} dashboard
                  </p>
                  <h1 className="truncate text-lg font-semibold text-neutral-900">{currentTitle}</h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="hidden rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 sm:inline-flex"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-neutral-900/10 transition hover:bg-neutral-800"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}