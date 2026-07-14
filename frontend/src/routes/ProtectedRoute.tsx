import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuthStore } from "@/stores/authStore"

/**
 * Gate for any authenticated-only branch of the route tree.
 * Redirects to /login (preserving the intended destination) if there's
 * no session, or if the JWT has expired (1hr lifespan, no refresh flow).
 */
export function ProtectedRoute() {
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isTokenExpired = useAuthStore((s) => s.isTokenExpired)

  if (!isAuthenticated || isTokenExpired()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
