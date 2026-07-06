from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import BadRequestError, ConflictError, NotFoundError
from app.models import LoanStatus
from app.services import LoanService


class LoanCli:
    def __init__(self, session: AsyncSession):
        self._session = session
        self._service = LoanService(session)

    async def display_menu(self):
        """Displays the loan menu and handles user input."""
        while True:
            print("\n" + "=" * 50)
            print("  📖 Loans Menu")
            print("=" * 50)
            print("1. Add Loan")
            print("2. List Loans")
            print("3. Update Loan")
            print("0. Back to Main Menu")

            choice = input("\nSelect option: ").strip()

            try:
                if choice == "1":
                    await self._add_loan()
                elif choice == "2":
                    await self._list_loans()
                elif choice == "3":
                    await self._update_loan()
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

    async def _add_loan(self):
        """Create a new loan request."""
        print("\n--- Add New Loan ---")

        user_id = self._get_int_input("User ID: ")
        if not user_id:
            return

        book_id = self._get_int_input("Book ID: ")
        if not book_id:
            return

        try:
            loan = await self._service.borrow_book(user_id, book_id)
            print("\n✅ Loan request created!")
            print(f"   Loan ID: {loan.id}")
            print(f"   User ID: {loan.user_id}")
            print(f"   Book ID: {loan.book_id}")
            print(f"   Status: {loan.status.value}")
            print(f"   Due Date: {loan.due_date.strftime('%Y-%m-%d')}")
        except NotFoundError as e:
            print(f"❌ {e}")
        except BadRequestError as e:
            print(f"❌ {e}")
        except ConflictError as e:
            print(f"❌ {e}")

    async def _list_loans(self):
        """List all loans."""
        print("\n--- List Loans ---")

        try:
            loans = await self._service.list_loans()

            if not loans:
                print("\nNo loans found in the system.")
                return

            print(f"\nFound {len(loans)} loan(s):")
            self._display_loans_table(loans)

        except Exception as e:
            print(f"❌ Error: {e}")

    async def _update_loan(self):
        """Update loan status (approve, return, mark overdue, cancel)."""
        print("\n--- Update Loan Status ---")

        loan_id = self._get_int_input("Enter Loan ID: ")
        if not loan_id:
            return

        try:
            loan = await self._service.get_loan(loan_id)

            print("\nCurrent Loan Details:")
            print(f"   Loan ID: {loan.id}")
            print(f"   User ID: {loan.user_id}")
            print(f"   Book ID: {loan.book_id}")
            print(f"   Status: {loan.status.value}")
            print(f"   Due Date: {loan.due_date.strftime('%Y-%m-%d')}")
            if loan.returned_date:
                print(f"   Returned: {loan.returned_date.strftime('%Y-%m-%d')}")

            # Show available transitions based on current status
            available_statuses = self._get_available_statuses(loan.status)

            if not available_statuses:
                print(
                    "\n⚠️  No status transitions available for "
                    f"'{loan.status.value}' loans."
                )
                return

            print("\nAvailable status changes:")
            for i, (status, description) in enumerate(available_statuses, 1):
                print(f"   {i}. {description} → {status.value}")

            choice = self._get_int_input("\nSelect new status: ")
            if not choice or choice < 1 or choice > len(available_statuses):
                print("❌ Invalid selection.")
                return

            new_status = available_statuses[choice - 1][0]

            confirm = (
                input(f"\nChange status to '{new_status.value}'? (y/n): ")
                .strip()
                .lower()
            )
            if confirm != "y":
                print("Update cancelled.")
                return

            # ✅ Route CANCELED to the dedicated cancel_loan method
            if new_status == LoanStatus.CANCELED:
                updated_loan = await self._service.cancel_loan(loan_id)
            else:
                updated_loan = await self._service.update_loan_status(
                    loan_id, new_status
                )

            print(f"\n✅ Loan status updated to '{updated_loan.status.value}'!")

        except NotFoundError as e:
            print(f"❌ {e}")
        except BadRequestError as e:
            print(f"❌ {e}")

    # ============================================================
    # Helper Methods
    # ============================================================

    def _get_available_statuses(self, current_status: LoanStatus) -> list:
        """Get available status transitions based on current status."""
        transitions = {
            LoanStatus.PENDING: [
                (LoanStatus.APPROVED, "Approve loan"),
                (LoanStatus.CANCELED, "Cancel loan"),
            ],
            LoanStatus.APPROVED: [
                (LoanStatus.RETURNED, "Return book"),
                (LoanStatus.OVERDUE, "Mark as overdue"),
            ],
            LoanStatus.OVERDUE: [
                (LoanStatus.RETURNED, "Return book (overdue)"),
            ],
        }
        return transitions.get(current_status, [])

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

    def _display_loans_table(self, loans: list) -> None:
        """Display a list of loans in a formatted table."""
        header = (
            f"{'ID':<5} {'User':<8} {'Book':<8} {'Status':<12} "
            f"{'Due Date':<12} {'Returned':<12}"
        )
        print(f"\n{header}")
        print("-" * len(header))

        for loan in loans:
            returned = (
                loan.returned_date.strftime("%Y-%m-%d") if loan.returned_date else "-"
            )
            row = (
                f"{loan.id:<5} "
                f"{loan.user_id:<8} "
                f"{loan.book_id:<8} "
                f"{loan.status.value:<12} "
                f"{loan.due_date.strftime('%Y-%m-%d'):<12} "
                f"{returned:<12}"
            )
            print(row)
