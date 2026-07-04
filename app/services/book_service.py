class BookService:
    def __init__(self, session):
        self.session = session

    async def add_book(self, book_data):
        pass

    async def get_book(self, book_id):
        pass

    async def list_books(self):
        pass

    async def search_books(self, title, author):
        pass

    async def update_book(self, book_id, book_data):
        pass

    async def delete_book(self, book_id):
        pass
