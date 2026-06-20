import bcrypt
import secrets

def get_password_hash(password: str) -> str:
    """
    Generate a bcrypt password hash from a plain text password.
    """
    # bcrypt requires bytes
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a bcrypt password hash.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def generate_verification_token() -> str:
    """
    Generate a cryptographically secure, url-safe token for email verification.
    """
    return secrets.token_urlsafe(32)
