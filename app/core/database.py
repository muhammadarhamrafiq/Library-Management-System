import psycopg2

from app.core.settings import settings


def connect_to_database():
    try:
        connection = psycopg2.connect(settings.database_url)

        return connection
    except psycopg2.Error as e:
        print("Error: Could not connect to the database.")
        print(e)
        return None
