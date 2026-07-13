import type { Role } from "./auth.types"

export interface User {
  id: number
  email: string
  full_name: string
  role: Role
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserCreate {
  email: string
  password: string
  full_name: string
}

export interface UserUpdate {
  email?: string
  full_name?: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export interface ChangeRoleRequest {
  role: Role
}

// otp_schemas.py
export interface VerifyOTPRequest {
  email: string
  otp: string
}

export interface ResetRequest {
  email: string
}

export interface ConfirmResetRequest {
  token: string
  new_password: string
}
