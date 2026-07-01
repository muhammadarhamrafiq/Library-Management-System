from app.core.database import connect_to_database


def main():
    db_connection = connect_to_database()
    if db_connection:
        print("Welcome, to the Library Management System!")
    else:
        print("Failed to connect to the database.")


if __name__ == "__main__":
    main()
