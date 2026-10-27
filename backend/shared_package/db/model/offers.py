import uuid

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    Sequence,
    String,
    func,
)
from sqlalchemy.orm import relationship

from shared_package.db.base import Base

# inside the Contacts class
STAGES = ("New", "Contacted", "Proposal", "Won", "Lost")
PAYMENT_METHODS = ("Cash", "Bank Transfer", "Credit Card", "GCash")
PAYMENT_STATUSES = ("Paid", "Pending")

# A counter the database owns, so invoice numbers are 1001, 1002, ...
# and two simultaneous requests can never get the same number.
invoice_seq = Sequence("invoice_seq", start=1001, metadata=Base.metadata)


def _in(values: tuple[str, ...]) -> str:
    # ("A", "B") -> "'A', 'B'" for the CHECK constraints below
    return ", ".join(repr(v) for v in values)


class Offers(Base):
    __tablename__ = "offers"

    offer_id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    user_id = Column(
        String(36),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    contact_id = Column(
        String(36),
        ForeignKey("contacts.contact_id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    title = Column(String(200), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    stage = Column(String(20), nullable=False, default="New", server_default="New")
    closed_at = Column(DateTime(timezone=True), nullable=True)  # set when Won or Lost

    # Payment info: only filled in once the offer is Won
    invoice_ref = Column(String(20), nullable=True, unique=True)  # e.g. INV-1001
    payment_method = Column(String(20), nullable=True)
    payment_status = Column(String(10), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    contact = relationship("Contacts", back_populates="offers")

    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_offers_amount_positive"),
        CheckConstraint(f"stage IN ({_in(STAGES)})", name="ck_offers_stage"),
        CheckConstraint(
            f"payment_method IS NULL OR payment_method IN ({_in(PAYMENT_METHODS)})",
            name="ck_offers_payment_method",
        ),
        CheckConstraint(
            f"payment_status IS NULL OR payment_status IN ({_in(PAYMENT_STATUSES)})",
            name="ck_offers_payment_status",
        ),
        # closed_at is set exactly when the offer is Won or Lost
        CheckConstraint(
            "(stage IN ('Won', 'Lost')) = (closed_at IS NOT NULL)",
            name="ck_offers_closed_at",
        ),
        # payment info exists exactly when the offer is Won
        CheckConstraint(
            "(stage = 'Won') = (payment_method IS NOT NULL AND payment_status IS NOT NULL)",
            name="ck_offers_payment_when_won",
        ),
        # paid_at is set exactly when the payment is Paid
        CheckConstraint(
            "COALESCE(payment_status = 'Paid', FALSE) = (paid_at IS NOT NULL)",
            name="ck_offers_paid_at",
        ),
        Index("ix_offers_user_stage", user_id, stage),
        Index("ix_offers_user_paid_at", user_id, paid_at),
    )