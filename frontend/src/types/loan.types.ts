export type LoanStatus =
  | "pending"
  | "approved"
  | "returned"
  | "overdue"
  | "rejected"
  | "canceled"

export interface Loan {
  id: number
  user_id: number
  book_id: number
  due_date: string
  returned_date: string | null
  renew_count: number
  fine_amount: number
  fine_paid: boolean
  status: LoanStatus
  created_at: string
  updated_at: string
}

export interface LoanRequest {
  book_id: number
}

export interface LoanListParams {
  status?: LoanStatus
  book_id?: number
  user_id?: number
  outstanding_fine?: boolean
  skip?: number
  limit?: number
}
