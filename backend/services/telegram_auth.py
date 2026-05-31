import hashlib
import hmac
import json
import time
from urllib.parse import unquote, parse_qsl
from config import get_settings

settings = get_settings()

INIT_DATA_MAX_AGE = 86400  # 24 hours


def validate_telegram_init_data(init_data: str) -> dict:
    """
    Validate Telegram Mini App initData per official spec.
    Returns parsed user dict if valid, raises ValueError if not.
    """
    if not init_data or len(init_data) > 4096:
        raise ValueError("Invalid initData length")

    params = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = params.pop("hash", None)

    if not received_hash:
        raise ValueError("Missing hash in initData")

    # Reject stale initData (replay attack prevention)
    auth_date = params.get("auth_date")
    if auth_date:
        try:
            age = int(time.time()) - int(auth_date)
            if age > INIT_DATA_MAX_AGE:
                raise ValueError("initData has expired")
        except (ValueError, TypeError):
            raise ValueError("Invalid auth_date")

    # Build data-check-string: sorted key=value pairs joined by \n
    data_check_string = "\n".join(
        f"{k}={v}" for k, v in sorted(params.items())
    )

    # HMAC-SHA256 with secret = HMAC-SHA256("WebAppData", bot_token)
    secret_key = hmac.new(b"WebAppData", settings.telegram_bot_token.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed_hash, received_hash):
        raise ValueError("initData hash mismatch")

    user_raw = params.get("user")
    if not user_raw:
        raise ValueError("No user in initData")

    return json.loads(unquote(user_raw))
