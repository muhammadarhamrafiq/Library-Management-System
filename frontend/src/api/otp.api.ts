import { api } from "./axios"
import type {
  ConfirmResetRequest,
  ResetRequest,
  UserCreate,
  VerifyOTPRequest,
} from "@/types/user.types"
import type { User } from "@/types/user.types"

export const otpApi = {
  registerInitiate: (data: UserCreate) =>
    api.post<{ message: string }>("/register/initiate", data).then((res) => res.data),

  registerVerify: (data: VerifyOTPRequest) =>
    api.post<User>("/register/verify", data).then((res) => res.data),

  resetInitiate: (data: ResetRequest) =>
    api
      .post<{ message: string }>("/reset-password/initiate", data)
      .then((res) => res.data),

  resetVerify: (data: VerifyOTPRequest) =>
    api
      .post<{ token: string }>("/reset-password/verify", data)
      .then((res) => res.data),

  resetConfirm: (data: ConfirmResetRequest) =>
    api.post<User>("/reset-password/confirm", data).then((res) => res.data),
}
