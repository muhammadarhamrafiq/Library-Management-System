from pwdlib import PasswordHash

password_hasher = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """
    Hashes a password using the PasswordHasher from pwdlib.

    Arguments:
        password (str): The plain text password to be hashed.

    Returns:
        str: The hashed password.
    """
    return password_hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verifies a password against a hashed password.

    Arguments:
        password (str): The plain text password to verify.
        hashed_password (str): The hashed password to compare against.

    Returns:
        bool: True if the password matches the hashed password, False otherwise.
    """
    return password_hasher.verify(password, hashed_password)
