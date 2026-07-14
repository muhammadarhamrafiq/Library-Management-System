import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "@/stores/authStore"
import type { Role } from "@/types/auth.types"

interface RoleGuardProps {
  allowedRoles: Role[]
}

/**
 * Nests inside ProtectedRoute — assumes auth is already confirmed.
 * Sends the user to /unauthorized if their role isn't in the allow-list,
 * rather than bouncing them all the way back to /login.
 */
export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const role = useAuthStore((s) => s.role)

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
