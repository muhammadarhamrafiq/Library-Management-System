import { api } from "./axios"
import type {
  ChangePasswordRequest,
  ChangeRoleRequest,
  User,
  UserUpdate,
} from "@/types/user.types"
import type { PaginatedResponse } from "@/types/pagination.types"

export interface UserListParams {
  search_query?: string
  full_name?: string
  email?: string
  role?: string
  is_active?: boolean
  sortBy?: "id" | "full_name" | "email" | "created_at" | "is_active"
  sortOrder?: "asc" | "desc"
  skip?: number
  limit?: number
}

export const usersApi = {
  getMe: () => api.get<User>("/user/me").then((res) => res.data),

  updateMe: (data: UserUpdate) => api.put<User>("/user", data).then((res) => res.data),

  changePassword: (data: ChangePasswordRequest) =>
    api.put<User>("/user/password", data).then((res) => res.data),

  deactivateMe: () => api.delete<User>("/user").then((res) => res.data),

  // Admin only — list_users returns a full pagination envelope
  list: (params?: UserListParams) =>
    api
      .get<PaginatedResponse<User>>("/user", { params })
      .then((res) => res.data),

  getById: (userId: number, includeInactive = false) =>
    api
      .get<User>(`/user/${userId}`, { params: { include_inactive: includeInactive } })
      .then((res) => res.data),

  activate: (userId: number) =>
    api.put<User>(`/user/${userId}/activate`).then((res) => res.data),

  deactivate: (userId: number) =>
    api.put<User>(`/user/${userId}/deactivate`).then((res) => res.data),

  changeRole: (userId: number, data: ChangeRoleRequest) =>
    api.put<User>(`/user/${userId}/role`, data).then((res) => res.data),
}
