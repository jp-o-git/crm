from datetime import datetime, timedelta, timezone

from sqlalchemy import text
from sqlalchemy.orm import Session


def delete_stale_tokens(db: Session, user_id: str) -> None:
    # Expired rows are useless. Revoked rows are only needed briefly
    # to detect a stolen token being reused, so keep them 2 days.
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=2)
    db.execute(
        text(
            """
            delete from refresh_tokens
            where user_id = :user_id
              and (
                expires_at < :now
                or (revoked = true and created_at < :cutoff)
              )
            """
        ),
        {"user_id": user_id, "now": now, "cutoff": cutoff},
    )