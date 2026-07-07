from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import BadRequestError, ConflictError
from app.schemas import UserCreate
from app.services import UserService


class UserCli:
    def __init__(self, session: AsyncSession):
        self._session = session
        self._service = UserService(session)

    async def display_menu(self):
        """Displays the user menu and handles user input."""
        while True:
            print("\n" + "=" * 50)
            print("  👥 Users Menu")
            print("=" * 50)
            print("1. Add User")
            print("2. List Users")
            print("0. Back to Main Menu")

            choice = input("\nSelect option: ").strip()

            try:
                if choice == "1":
                    await self._add_user()
                elif choice == "2":
                    await self._list_users()
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

    async def _add_user(self):
        """Register a new user."""
        print("\n--- Add New User ---")

        full_name = self._get_input("Full Name: ")
        if not full_name:
            return

        email = self._get_input("Email: ")
        if not email:
            return

        password = self._get_input("Password: ")
        if not password:
            return

        try:
            user = await self._service.register_user(
                UserCreate(
                    full_name=full_name,
                    email=email,
                    password=password,
                )
            )
            print("\n✅ User added successfully!")
            print(f"   ID: {user.id}")
            print(f"   Name: {user.full_name}")
            print(f"   Email: {user.email}")
            print(f"   Role: {user.role.value}")
        except ConflictError as e:
            print(f"❌ {e}")
        except BadRequestError as e:
            print(f"❌ {e}")

    async def _list_users(self):
        """List all users."""
        print("\n--- List Users ---")

        try:
            result = await self._service.list_users(limit=20)

            if not result["data"]:
                print("\nNo users found in the system.")
                return

            print(f"\nFound {result['total']} user(s):")
            self._display_users_table(result["data"])

        except Exception as e:
            print(f"❌ Error: {e}")

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

    def _display_users_table(self, users: list) -> None:
        """Display a list of users in a formatted table."""
        header = f"{'ID':<5} {'Name':<25} {'Email':<30} {'Role':<12} {'Active':<8}"
        print(f"\n{header}")
        print("-" * len(header))

        for user in users:
            active_status = "Yes" if user.is_active else "No"
            row = (
                f"{user.id:<5} "
                f"{user.full_name[:23]:<25} "
                f"{user.email[:28]:<30} "
                f"{user.role.value:<12} "
                f"{active_status:<8}"
            )
            print(row)
