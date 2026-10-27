from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from shared_package.db.model.contacts import Contacts
from shared_package.db.model.offers import Offers, STAGES


def build_report(db: Session, user_id: str, days: int | None) -> dict:
    since = datetime.now(timezone.utc) - timedelta(days=days) if days else None
    owned = [Offers.user_id == user_id, Offers.deleted_at.is_(None)]

    # 1. Offers created in the period, counted per stage
    created = list(owned)
    if since:
        created.append(Offers.created_at >= since)
    rows = db.execute(
        select(Offers.stage, func.count()).where(*created).group_by(Offers.stage)
    ).all()
    by_stage = {stage: 0 for stage in STAGES}
    by_stage.update({stage: count for stage, count in rows})

    # 2. Paid revenue: per day for 7/30 days, per month for all time
    bucket = func.date_trunc("day" if days else "month", Offers.paid_at)
    paid = [*owned, Offers.payment_status == "Paid"]
    if since:
        paid.append(Offers.paid_at >= since)
    revenue_rows = db.execute(
        select(bucket, func.sum(Offers.amount))
        .where(*paid)
        .group_by(bucket)
        .order_by(bucket)
    ).all()

    # 3. Top 5 contacts by value of offers won in the period
    won = [*owned, Offers.stage == "Won"]
    if since:
        won.append(Offers.closed_at >= since)
    total = func.sum(Offers.amount)
    top_rows = db.execute(
        select(Contacts.contact_id, Contacts.name, Contacts.company, func.count(), total)
        .join(Contacts, Contacts.contact_id == Offers.contact_id)
        .where(*won)
        .group_by(Contacts.contact_id, Contacts.name, Contacts.company)
        .order_by(total.desc())
        .limit(5)
    ).all()

    return {
        "by_stage": by_stage,
        "revenue": [
            {"date": day.date().isoformat(), "total": float(amount)}
            for day, amount in revenue_rows
        ],
        "top_contacts": [
            {"contact_id": cid, "name": name, "company": company,
             "count": count, "total": float(amount)}
            for cid, name, company, count, amount in top_rows
        ],
    }