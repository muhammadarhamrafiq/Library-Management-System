import asyncio
import sys

from sqlalchemy.exc import SQLAlchemyError

from app.cli.commands import BookCli, LoanCli, UserCli
from app.core.database import SessionLocal

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


async def main_menu():
    """
    Displays the main menu and handles user input.
    """

    async with SessionLocal() as session:
        book_cli = BookCli(session)
        user_cli = UserCli(session)
        loan_cli = LoanCli(session)

        while True:
            print("\n" + "=" * 50)
            print("Library Management System")
            print("\n" + "=" * 50)
            print("1. Books")
            print("2. Users")
            print("3. Loans")
            print("0. Exit")
            choice = input("\nSelect option: ").strip()

            try:
                if choice == "1":
                    await book_cli.display_menu()
                elif choice == "2":
                    await user_cli.display_menu()
                elif choice == "3":
                    await loan_cli.display_menu()
                elif choice == "0":
                    print("Exiting the application...")
                    break
                else:
                    print("Invalid Option Selected!")
            except SQLAlchemyError as e:
                print(f"Database error occured: {e}")
                input("Press Enter to continue...")


def main():
    """
    Entry point for the CLI application.
    """
    try:
        asyncio.run(main_menu())
        print("Application exited successfully.")
    except KeyboardInterrupt:
        print("\nApplication interrupted by user.")
        print("Exiting the application...")


if __name__ == "__main__":
    main()
