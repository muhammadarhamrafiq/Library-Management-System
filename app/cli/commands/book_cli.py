from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import BadRequestError, ConflictError, NotFoundError
from app.schemas import BookCreate
from app.services import BookService


class BookCli:
    def __init__(self, session: AsyncSession):
        self._session = session
        self._service = BookService(session)

    async def display_menu(self):
        """Displays the book menu and handles user input."""
        while True:
            print("\n" + "=" * 50)
            print("  📚 Books Menu")
            print("=" * 50)
            print("1. Add Book")
            print("2. List Books")
            print("3. Search Books")
            print("4. Remove Book")
            print("0. Back to Main Menu")

            choice = input("\nSelect option: ").strip()

            try:
                if choice == "1":
                    await self._add_book()
                elif choice == "2":
                    await self._list_books()
                elif choice == "3":
                    await self._search_books()
                elif choice == "4":
                    await self._remove_book()
                elif choice == "0":
                    print("Returning to Main Menu...")
                    break
                else:
                    print("❌ Invalid Option Selected!")
            except Exception as e:
                print(f"❌ Unexpected error: {e}")

            input("\nPress Enter to continue...")

    # ============================================================
    # Core Operations
    # ============================================================

    async def _add_book(self):
        """Add a new book to the library."""
        print("\n--- Add New Book ---")

        title = self._get_input("Title: ")
        if not title:
            return

        author = self._get_input("Author: ")
        if not author:
            return

        isbn = self._get_input("ISBN (optional, press Enter to skip): ", required=False)
        total_copies = self._get_int_input("Total Copies [1]: ") or 1

        try:
            book = await self._service.add_book(
                BookCreate(
                    title=title,
                    author=author,
                    isbn=isbn,
                    total_copies=total_copies,
                )
            )
            print("\n✅ Book added successfully!")
            print(f"   ID: {book.id}")
            print(f"   Title: {book.title}")
            print(f"   Author: {book.author}")
            print(f"   Total Copies: {book.total_copies}")
        except ConflictError as e:
            print(f"❌ {e}")
        except BadRequestError as e:
            print(f"❌ {e}")

    async def _list_books(self):
        """List all available books."""
        print("\n--- List Books ---")

        try:
            result = await self._service.list_books(limit=20)

            if not result["data"]:
                print("\nNo books found in the library.")
                return

            print(f"\nFound {result['total']} book(s):")
            self._display_books_table(result["data"])

        except Exception as e:
            print(f"❌ Error: {e}")

    async def _search_books(self):
        """Search for books by keyword."""
        print("\n--- Search Books ---")

        query = self._get_input("Enter search term: ")
        if not query:
            return

        try:
            result = await self._service.list_books(search_query=query, limit=20)

            if not result["data"]:
                print(f"\nNo books found matching '{query}'.")
                return

            print(f"\nFound {result['total']} book(s) matching '{query}':")
            self._display_books_table(result["data"])
        except Exception as e:
            print(f"❌ Error: {e}")

    async def _remove_book(self):
        """Remove (soft delete) a book."""
        print("\n--- Remove Book ---")

        book_id = self._get_int_input("Enter Book ID to remove: ")
        if not book_id:
            return

        try:
            book = await self._service.get_book(book_id)
            print("\nBook to remove:")
            print(f"   ID: {book.id}")
            print(f"   Title: {book.title}")
            print(f"   Author: {book.author}")

            confirm = (
                input("\nAre you sure you want to remove this book? (y/n): ")
                .strip()
                .lower()
            )
            if confirm != "y":
                print("Removal cancelled.")
                return

            await self._service.delete_book(book_id)
            print(f"\n✅ Book '{book.title}' removed successfully.")

        except NotFoundError as e:
            print(f"❌ {e}")
        except BadRequestError as e:
            print(f"❌ {e}")

    # ============================================================
    # Helper Methods
    # ============================================================

    def _get_input(self, prompt: str, required: bool = True) -> str | None:
        """Get string input from user."""
        value = input(prompt).strip()
        if required and not value:
            print("⚠️  This field is required.")
            return self._get_input(prompt, required)
        return value if value else None

    def _get_int_input(self, prompt: str, required: bool = True) -> int | None:
        """Get integer input from user."""
        value = input(prompt).strip()
        if not value:
            if required:
                print("⚠️  This field is required.")
                return self._get_int_input(prompt, required)
            return None
        try:
            return int(value)
        except ValueError:
            print("⚠️  Please enter a valid number.")
            return self._get_int_input(prompt, required)

    def _display_books_table(self, books: list) -> None:
        """Display a list of books in a formatted table."""
        print(f"\n{'ID':<5} {'Title':<30} {'Author':<20} {'Available':<12}")
        print("-" * 70)
        for book in books:
            availability = f"{book.available_copies}/{book.total_copies}"
            print(
                f"{book.id:<5} "
                f"{book.title[:28]:<30} "
                f"{book.author[:18]:<20} "
                f"{availability:<12}"
            )
