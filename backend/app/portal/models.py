from __future__ import annotations
from pydantic.alias_generators import to_camel
from decimal import Decimal

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class Token(BaseModel):
    access_token: str
    token_type: str


class SignupStartRequest(BaseModel):
    email: EmailStr


class SignupTokenRequest(BaseModel):
    token: str = Field(min_length=20, max_length=200)


class SignupCompleteRequest(BaseModel):
    token: str = Field(min_length=20, max_length=200)
    full_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class RoomBase(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str = Field(min_length=1, max_length=2000)
    price: float = Field(ge=0)
    image_url: str | None = None
    bed_type: str = Field(min_length=1, max_length=80)
    max_guests: int = Field(ge=1, le=30)
    size_sqm: int = Field(ge=1, le=500)
    amenities: list[str] = Field(default_factory=list)
    status: Literal["available", "unavailable", "coming_soon"] = "available"
    available_from: date | None = None

    model_config = ConfigDict(from_attributes=True)


class RoomCreate(RoomBase):
    pass


class RoomPublic(RoomBase):
    id: int
    slug: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class RoomPage(BaseModel):
    items: list[RoomPublic]
    page: int
    limit: int
    total: int
    total_pages: int


class ReservationCreate(BaseModel):
    room_id: int
    check_in: date
    check_out: date
    guests: int = Field(ge=1, le=15)

    model_config = ConfigDict(from_attributes=True)


class ReservationRead(BaseModel):
    id: int
    guest_name: str
    guest_email: str
    room_id: int
    room_name: str
    check_in: date
    check_out: date
    guests: int
    total: float
    status: Literal["pending", "reserved", "unavailable", "coming_soon", "cancelled"]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReservationStatusUpdate(BaseModel):
    status: Literal["pending", "reserved", "unavailable", "coming_soon", "cancelled"]


class TicketCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    summary: str = Field(min_length=1, max_length=4000)


class TicketRead(BaseModel):
    id: int
    ticket_number: str
    title: str
    summary: str
    user_id: str
    user_name: str
    user_email: str
    status: Literal["open", "in_progress", "resolved"]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TicketStatusUpdate(BaseModel):
    status: Literal["open", "in_progress", "resolved"]


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class ThreadMessageRead(BaseModel):
    id: int
    sender: Literal["user", "admin"]
    body: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


#-------------------------- Common -----------------------------

class CamelModel(BaseModel):
    # Python uses created_at, the JSON uses createdAt
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

#-------------------------- Contacts -----------------------------


class ContactCreate(CamelModel):          # what the frontend sends to ADD
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    company: str = Field(min_length=1, max_length=120)


class ContactUpdate(CamelModel):          # what the frontend sends to EDIT
    # Every field is optional: send only what changed
    name: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=40)
    company: str | None = Field(default=None, min_length=1, max_length=120)


class ContactOut(CamelModel):             # what we send back
    id: str
    name: str
    email: str
    phone: str | None
    company: str
    created_at: datetime

class ContactPage(CamelModel):
    items: list[ContactOut]
    total: int          # how many contacts match, across all pages
    page: int
    page_size: int
    total_pages: int

# ----------------------- Offer ------------------------
Stage = Literal["New", "Contacted", "Proposal", "Won", "Lost"]
PaymentMethod = Literal["Cash", "Bank Transfer", "Credit Card", "GCash"]
PaymentStatus = Literal["Paid", "Pending"]


class PaymentIn(CamelModel):             # payment details sent when an offer is Won
    method: PaymentMethod
    status: PaymentStatus


class _StageWithPayment(CamelModel):
    """Shared rule: a Won offer must come with payment details."""

    stage: Stage
    payment: PaymentIn | None = None

    @model_validator(mode="after")
    def payment_required_for_won(self):
        if self.stage == "Won" and self.payment is None:
            raise ValueError("Payment details are required for a Won offer.")
        return self                      # a failed check becomes a 422 automatically


class OfferCreate(_StageWithPayment):    # POST /offers
    contact_id: str
    title: str = Field(min_length=1, max_length=200)
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    stage: Stage = "New"                 # same field, now with a default


class StageUpdate(_StageWithPayment):    # PATCH /offers/{id}/stage
    pass


class PaymentUpdate(CamelModel):         # PATCH /offers/{id}/payment
    status: Literal["Paid"]              # the only change allowed is "mark as paid"


class PaymentOut(CamelModel):
    reference: str
    method: PaymentMethod
    status: PaymentStatus
    paid_at: datetime | None


class OfferOut(CamelModel):
    id: str
    contact_id: str
    contact_name: str
    title: str
    amount: float                        # float, so the frontend can do math on it
    stage: Stage
    created_at: datetime
    closed_at: datetime | None
    payment: PaymentOut | None           # null unless the offer is Won


class OfferPage(CamelModel):
    items: list[OfferOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class OfferSummary(CamelModel):          # the cards on Offers and Dashboard
    open_count: int
    won_count: int
    lost_count: int
    won_value: float
    paid_value: float
    pending_value: float
    by_stage: dict[str, int]


class RevenuePoint(CamelModel):
    date: str                            # "2026-10-27", or the first day of the month
    total: float


class TopContact(CamelModel):
    contact_id: str
    name: str
    company: str
    count: int
    total: float


class ReportOut(CamelModel):
    by_stage: dict[str, int]
    revenue: list[RevenuePoint]
    top_contacts: list[TopContact]

class ReportEmailRequest(CamelModel):
    email: EmailStr
    days: int | None = Field(default=None, ge=1, le=365)