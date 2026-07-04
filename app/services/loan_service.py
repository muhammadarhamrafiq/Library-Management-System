class LoanService:
    def __init__(self, session):
        self.session = session

    async def borrow_book(self, user_id: int, book_id: int):
        pass

    async def return_book(self, loan_id: int):
        pass

    async def renew_loan(self, loan_id: int):
        pass

    async def get_active_loans(self, user_id: int | None = None):
        pass

    async def get_overdue_loans(self, user_id: int | None = None):
        pass

    async def get_loan_history(self, user_id: int | None = None):
        pass
