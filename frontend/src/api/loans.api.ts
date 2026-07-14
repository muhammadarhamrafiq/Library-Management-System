import { api } from "./axios"
import type { Loan, LoanListParams, LoanRequest } from "@/types/loan.types"
import type { PaginatedResponse } from "@/types/pagination.types"

export const loansApi = {
  borrow: (data: LoanRequest) => api.post<Loan>("/loans/", data).then((res) => res.data),

  // list_loans returns a full pagination envelope, not a bare array
  list: (params?: LoanListParams) =>
    api
      .get<PaginatedResponse<Loan>>("/loans/", { params })
      .then((res) => res.data),

  getById: (loanId: number) => api.get<Loan>(`/loans/${loanId}`).then((res) => res.data),

  return: (loanId: number) =>
    api.put<Loan>(`/loans/${loanId}/return`).then((res) => res.data),

  cancel: (loanId: number) =>
    api.put<Loan>(`/loans/${loanId}/cancel`).then((res) => res.data),

  renew: (loanId: number) =>
    api.put<Loan>(`/loans/${loanId}/renew`).then((res) => res.data),

  // Librarian/admin only
  approve: (loanId: number) =>
    api.put<Loan>(`/loans/${loanId}/approve`).then((res) => res.data),

  reject: (loanId: number) =>
    api.put<Loan>(`/loans/${loanId}/reject`).then((res) => res.data),

  payFine: (loanId: number) =>
    api.put<Loan>(`/loans/${loanId}/pay-fine`).then((res) => res.data),
}
