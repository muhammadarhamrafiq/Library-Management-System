from pydantic import BaseModel


class MonthlyReportData(BaseModel):
    year: int
    month: int
    total_books_borrowed: int
    total_books_returned: int
    avg_active_loans: float
    avg_overdue_loans: float
    avg_active_members: float
    days_included: int
