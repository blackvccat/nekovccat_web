"""Create short-lived, session-bound proofs after a verified visitor login."""
import hashlib
import hmac
import re
import time

SESSION_RE = re.compile(r"^[a-f0-9]{48}$")


def create_visitor_proof(session_nonce: str, secret: str, now: int | None = None) -> str | None:
    """Sign the browser's own session nonce so the proof only fits that one browser."""
    if not SESSION_RE.fullmatch(session_nonce) or len(secret) < 32:
        return None
    expires = (now or int(time.time())) + 120
    payload = f"v1.{session_nonce}.{expires}"
    signature = hmac.new(secret.encode(), f"visitor-unlock:{payload}".encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{signature}"
