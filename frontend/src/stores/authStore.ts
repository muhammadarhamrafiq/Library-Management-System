import { create } from "zustand"
import { persist } from "zustand/middleware"
import { jwtDecode } from "jwt-decode"
import type { JwtPayload, Role } from "@/types/auth.types"

interface AuthState {
  token: string | null
  userId: number | null
  role: Role | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
  isTokenExpired: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      userId: null,
      role: null,
      isAuthenticated: false,

      login: (token: string) => {
        const payload = jwtDecode<JwtPayload>(token)
        set({
          token,
          userId: Number(payload.sub),
          role: payload.role,
          isAuthenticated: true,
        })
      },

      logout: () => {
        set({ token: null, userId: null, role: null, isAuthenticated: false })
      },

      isTokenExpired: () => {
        const token = get().token
        if (!token) return true
        try {
          const payload = jwtDecode<JwtPayload>(token)
          return payload.exp * 1000 < Date.now()
        } catch {
          return true
        }
      },
    }),
    {
      name: "lms-auth", // localStorage key
      partialize: (state) => ({ token: state.token }), // only persist the token
      onRehydrateStorage: () => (state) => {
        // On reload, rebuild role/userId from the persisted token
        if (state?.token) {
          try {
            const payload = jwtDecode<JwtPayload>(state.token)
            if (payload.exp * 1000 < Date.now()) {
              state.logout()
            } else {
              state.userId = Number(payload.sub)
              state.role = payload.role
              state.isAuthenticated = true
            }
          } catch {
            state.logout()
          }
        }
      },
    }
  )
)
