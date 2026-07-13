export type Role = "admin" | "librarian" | "member"

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

// Shape of the decoded JWT payload (see security.py generate_access_token)
export interface JwtPayload {
  sub: string
  role: Role
  exp: number
}
