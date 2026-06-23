import logging

import jwt
from jwt import PyJWKClient

from app.core.config import settings

logger = logging.getLogger(__name__)

GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISS = "https://accounts.google.com"
GOOGLE_ISS_ALT = "accounts.google.com"

_jwks_client = PyJWKClient(GOOGLE_CERTS_URL, cache_keys=True)


def verify_google_token(id_token: str) -> dict | None:
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(id_token)
        payload = jwt.decode(
            id_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.GOOGLE_CLIENT_ID,
            issuer=[GOOGLE_ISS, GOOGLE_ISS_ALT],
            options={"require": ["exp", "iat", "sub", "aud", "iss"]},
        )
        return {
            "email": payload.get("email"),
            "first_name": payload.get("given_name", ""),
            "last_name": payload.get("family_name", ""),
            "google_id": payload.get("sub"),
        }
    except Exception as e:
        logger.warning("Google token verification error: %s", e)
        return None
