from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, contains_eager

from shared_package.db.model.contacts import Contacts
from shared_package.db.model.offers import Offers, invoice_seq, STAGES
from app.services.error import ConflictError, NotFoundError
from app.portal.models import OfferOut, PaymentIn, PaymentOut

CLOSED_STAGES = ("Won", "Lost")


def to_offer_out(offer: Offers) -> OfferOut:
    # Only Won offers have a payment
    payment = None
    if offer.stage == "Won":
        payment = PaymentOut(
            reference=offer.invoice_ref,
            method=offer.payment_method,
            status=offer.payment_status,
            paid_at=offer.paid_at,
        )
    return OfferOut(
        id=offer.offer_id,
        contact_id=offer.contact_id,
        contact_name=offer.contact.name,
        title=offer.title,
        amount=float(offer.amount),
        stage=offer.stage,
        created_at=offer.created_at,
        closed_at=offer.closed_at,
        payment=payment,
    )


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _next_invoice_ref(db: Session) -> str:
    n = db.scalar(select(invoice_seq.next_value()))  # 1001, then 1002, ...
    return f"INV-{n}"


def _apply_stage(
    db: Session, offer: Offers, stage: str, payment: PaymentIn | None
) -> None:
    """Sets every column that depends on the stage, all together.
    The CHECK constraints reject a half-finished change."""
    if stage == "Won":
        if payment is None:  # the schema already blocks this, this is a safety net
            raise ValueError("Payment details are required for a Won offer.")
        now = _now()
        offer.stage = "Won"
        offer.closed_at = now
        offer.invoice_ref = _next_invoice_ref(db)
        offer.payment_method = payment.method
        offer.payment_status = payment.status
        offer.paid_at = now if payment.status == "Paid" else None
    elif stage == "Lost":
        offer.stage = "Lost"
        offer.closed_at = _now()
    else:  # New, Contacted, Proposal
        offer.stage = stage


def _offer_filters(
    user_id: str,
    stage: str | None,
    q: str | None,
    contact_id: str | None,
) -> list:
    """WHERE conditions shared by the count query and the page query."""
    conditions = [Offers.user_id == user_id, Offers.deleted_at.is_(None)]
    if stage:
        conditions.append(Offers.stage == stage)
    if contact_id:
        conditions.append(Offers.contact_id == contact_id)
    if q and q.strip():
        like = f"%{q.strip().lower()}%"
        conditions.append(
            or_(  # match the offer title OR the contact's name
                func.lower(Offers.title).like(like),
                func.lower(Contacts.name).like(like),
            )
        )
    return conditions


def list_offers(
    db: Session,
    user_id: str,
    *,
    stage: str | None = None,
    q: str | None = None,
    contact_id: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[Offers], int]:
    """Returns (offers on this page, total number of matching offers)."""
    conditions = _offer_filters(user_id, stage, q, contact_id)

    total = db.scalar(
        select(func.count())
        .select_from(Offers)
        .join(Contacts, Contacts.contact_id == Offers.contact_id)
        .where(*conditions)
    ) or 0

    offers = db.scalars(
        select(Offers)
        .join(Offers.contact)
        .options(contains_eager(Offers.contact))  # load the contact in the same query
        .where(*conditions)
        .order_by(Offers.created_at.desc(), Offers.offer_id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return list(offers), total


def offer_summary(db: Session, user_id: str) -> dict:
    owned = (Offers.user_id == user_id, Offers.deleted_at.is_(None))

    rows = db.execute(
        select(Offers.stage, func.count()).where(*owned).group_by(Offers.stage)
    ).all()
    by_stage = {stage: 0 for stage in STAGES}   # stages with no offers still show 0
    by_stage.update({stage: count for stage, count in rows})

    won_value, paid_value, pending_value = db.execute(
        select(
            func.coalesce(func.sum(Offers.amount).filter(Offers.stage == "Won"), 0),
            func.coalesce(func.sum(Offers.amount).filter(Offers.payment_status == "Paid"), 0),
            func.coalesce(func.sum(Offers.amount).filter(Offers.payment_status == "Pending"), 0),
        ).where(*owned)
    ).one()

    return {
        "open_count": by_stage["New"] + by_stage["Contacted"] + by_stage["Proposal"],
        "won_count": by_stage["Won"],
        "lost_count": by_stage["Lost"],
        "won_value": won_value,
        "paid_value": paid_value,
        "pending_value": pending_value,
        "by_stage": by_stage,
    }


def get_offer(
    db: Session, user_id: str, offer_id: str, *, lock: bool = False
) -> Offers:
    stmt = (
        select(Offers)
        .join(Offers.contact)
        .options(contains_eager(Offers.contact))
        .where(
            Offers.offer_id == offer_id,
            Offers.user_id == user_id,      # only YOUR offers
            Offers.deleted_at.is_(None),
        )
    )
    if lock:
        # Locks the row, so two requests can't change the same offer at once
        stmt = stmt.with_for_update(of=Offers)

    offer = db.scalars(stmt).first()
    if offer is None:
        raise NotFoundError("Offer not found.")
    return offer


def create_offer(
    db: Session,
    user_id: str,
    *,
    contact_id: str,
    title: str,
    amount: Decimal,
    stage: str = "New",
    payment: PaymentIn | None = None,
) -> Offers:
    # The contact must be yours and not deleted
    contact = db.scalar(
        select(Contacts).where(
            Contacts.contact_id == contact_id,
            Contacts.user_id == user_id,
            Contacts.deleted_at.is_(None),
        )
    )
    if contact is None:
        raise NotFoundError("Contact not found.")

    offer = Offers(
        user_id=user_id,
        contact_id=contact_id,
        title=title.strip(),
        amount=amount,
    )
    _apply_stage(db, offer, stage, payment)
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


def change_stage(
    db: Session,
    user_id: str,
    offer_id: str,
    stage: str,
    payment: PaymentIn | None = None,
) -> Offers:
    offer = get_offer(db, user_id, offer_id, lock=True)

    if offer.stage in CLOSED_STAGES:
        raise ConflictError("This offer is already closed.")
    if stage == offer.stage:
        raise ConflictError(f"This offer is already in {stage}.")

    _apply_stage(db, offer, stage, payment)
    db.commit()
    db.refresh(offer)
    return offer


def mark_paid(db: Session, user_id: str, offer_id: str) -> Offers:
    offer = get_offer(db, user_id, offer_id, lock=True)

    if offer.stage != "Won":
        raise ConflictError("Only Won offers have a payment.")

    # Already paid -> do nothing, so clicking twice is harmless
    if offer.payment_status != "Paid":
        offer.payment_status = "Paid"
        offer.paid_at = _now()
        db.commit()
        db.refresh(offer)
    return offer