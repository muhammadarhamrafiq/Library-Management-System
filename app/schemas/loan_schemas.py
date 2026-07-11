from pydantic import BaseModel


class LoanRequest(BaseModel):
    book_id: int
