import axios from "axios"
import { useAuthStore } from "@/stores/authStore"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

// Attach the JWT to every outgoing request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// No refresh-token flow on the backend (1hr access token, expire = re-login).
// On any 401, clear the session and bounce to /login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?sessionExpired=true"
      }
    }
    return Promise.reject(error)
  }
)
