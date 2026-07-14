export interface DailyStatistics {
  stat_date: string
  books_borrowed: number
  books_returned: number
  active_loans: number
  overdue_loans: number
  active_members: number
  updated_at: string
}

export interface MonthlyReportData {
  year: number
  month: number
  total_books_borrowed: number
  total_books_returned: number
  avg_active_loans: number
  avg_overdue_loans: number
  avg_active_members: number
  days_included: number
}
