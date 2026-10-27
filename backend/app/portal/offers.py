import math

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from shared_package.db.get_session import get_session
from shared_package.sync_function.auth_dep import get_current_user
from shared_package.sync_function import offers as offer_service
from shared_package.sync_function.offers import to_offer_out

from app.portal.models import (
    OfferCreate,
    OfferOut,
    OfferPage,
    OfferSummary,
    PaymentUpdate,
    Stage,
    StageUpdate,
)

router = APIRouter(prefix="/offers", tags=["offers"])


# GET /offers?stage=Won&q=maria&contactId=...&page=1&pageSize=20
@router.get("", response_model=OfferPage)
def list_offers(
    stage: Stage | None = None,
    q: str | None = None,
    contact_id: str | None = Query(default=None, alias="contactId"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize"),
    db: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    offers, total = offer_service.list_offers(
        db,
        user.user_id,
        stage=stage,
        q=q,
        contact_id=contact_id,
        page=page,
        page_size=page_size,
    )
    return OfferPage(
        items=[to_offer_out(o) for o in offers],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, math.ceil(total / page_size)),
    )


# GET /offers/summary
# IMPORTANT: this must stay ABOVE "/{offer_id}". Otherwise FastAPI treats
# the word "summary" as an offer id and returns 404.
@router.get("/summary", response_model=OfferSummary)
def offer_summary(
    db: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    return OfferSummary(**offer_service.offer_summary(db, user.user_id))


# POST /offers
@router.post("", response_model=OfferOut, status_code=status.HTTP_201_CREATED)
def create_offer(
    body: OfferCreate,
    db: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    offer = offer_service.create_offer(
        db,
        user.user_id,
        contact_id=body.contact_id,
        title=body.title,
        amount=body.amount,
        stage=body.stage,
        payment=body.payment,
    )
    return to_offer_out(offer)


# GET /offers/{offer_id}
@router.get("/{offer_id}", response_model=OfferOut)
def get_offer(
    offer_id: str,
    db: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    return to_offer_out(offer_service.get_offer(db, user.user_id, offer_id))


# PATCH /offers/{offer_id}/stage
# Moves an offer to another stage. Won needs payment details.
@router.patch("/{offer_id}/stage", response_model=OfferOut)
def change_stage(
    offer_id: str,
    body: StageUpdate,
    db: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    offer = offer_service.change_stage(
        db, user.user_id, offer_id, body.stage, body.payment
    )
    return to_offer_out(offer)


# PATCH /offers/{offer_id}/payment   body: {"status": "Paid"}
@router.patch("/{offer_id}/payment", response_model=OfferOut)
def mark_paid(
    offer_id: str,
    body: PaymentUpdate,  # only {"status": "Paid"} is accepted
    db: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    return to_offer_out(offer_service.mark_paid(db, user.user_id, offer_id))