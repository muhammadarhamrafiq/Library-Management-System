from sqlalchemy import text

from app.core.database import SessionLocal


def main():
    with SessionLocal() as session:
        result = session.execute(text("SELECT 1"))
        print(result.scalar())


if __name__ == "__main__":
    main()
