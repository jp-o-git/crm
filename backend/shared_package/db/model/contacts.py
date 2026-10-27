import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, String, func
from sqlalchemy.orm import relationship
from shared_package.db.base import Base


class Contacts(Base):
    __tablename__ = "contacts"

    contact_id = Column(
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
    name = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(40), nullable=True)
    company = Column(String(120), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    offers = relationship("Offers", back_populates="contact")

    __table_args__ = (
        # One email per user, ignoring soft-deleted rows
        Index(
            "uq_contacts_user_email",
            user_id,
            func.lower(email),
            unique=True,
            postgresql_where=deleted_at.is_(None),
        ),
    )