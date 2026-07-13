import { Navigate } from "react-router-dom"
import { useAuthStore } from "@/stores/authStore"

export function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
}
