"""Create short-lived, session-bound proofs after verified quiz completion."""
import hashlib
import hmac
import re
import time


SESSION_RE = re.compile(r"^[a-f0-9]{48}$")


def create_unlock_proof(session_nonce: str, secret: str, now: int | None = None) -> str | None:
    if not SESSION_RE.fullmatch(session_nonce) or len(secret) < 32:
        return None
    expires = (now or int(time.time())) + 120
    payload = f"v1.{session_nonce}.{expires}"
    signature = hmac.new(secret.encode(), f"relationship-unlock:{payload}".encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{signature}"
