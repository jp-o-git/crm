from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session
import math

from shared_package.db.get_session import get_session
from shared_package.sync_function.auth_dep import get_current_user
from shared_package.sync_function.contacts import to_contact_out
from shared_package.sync_function import contacts as contact_service

from app.portal.models import (
    ContactCreate,
    ContactOut,
    ContactUpdate,
    ContactPage,
)

# Router for contact management endpoints.
router = APIRouter(prefix="/contacts", tags=["contacts"])

# GET /contacts
# Retrieves all non-deleted contacts belonging to the authenticated user.
# Supports an optional search query through the "q" parameter.
@router.get("", response_model=ContactPage)
def list_contacts(
    q: str | None = None,  # Optional search term for name, company, or email.
    page: int = Query(1, ge=1),  # Page number, starting at 1.
    page_size: int = Query(20, ge=1, le=100, alias="pageSize"),  # Max 100 per page.
    db: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    contacts, total = contact_service.list_contacts(
        db, user.user_id, q, page, page_size
    )

    return ContactPage(
        items=[to_contact_out(c) for c in contacts],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, math.ceil(total / page_size)),
    )


# POST /contacts
# Creates a new contact for the authenticated user.
@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def create_contact(
    body: ContactCreate,  # Validated contact data from the request body.
    db: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    # Create the contact and associate it with the current user.
    # The service checks for duplicate email addresses before saving.
    contact = contact_service.create_contact(
        db,
        user.user_id,
        name=body.name,
        email=str(body.email),
        phone=body.phone,
        company=body.company,
    )

    # Return the created contact using the expected response schema.
    return to_contact_out(contact)


# GET /contacts/{contact_id}
# Retrieves one contact by ID, provided it belongs to the authenticated user.
@router.get("/{contact_id}", response_model=ContactOut)
def get_contact(
    contact_id: str,  # ID of the contact to retrieve.
    db: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    # The service raises NotFoundError if the contact does not exist,
    # has been soft-deleted, or does not belong to this user.
    contact = contact_service.get_contact(db, user.user_id, contact_id)

    # Convert the database model into the API response schema.
    return to_contact_out(contact)


# PATCH /contacts/{contact_id}
# Updates only the fields supplied in the request body.
@router.patch("/{contact_id}", response_model=ContactOut)
def update_contact(
    contact_id: str,
    body: ContactUpdate,  # Validated fields to update.
    db: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    # exclude_unset=True ensures that only fields explicitly provided
    # by the frontend are included in the update.
    changes = body.model_dump(exclude_unset=True)

    # Update the contact after checking ownership and duplicate emails.
    contact = contact_service.update_contact(
        db, user.user_id, contact_id, changes
    )

    # Return the updated contact.
    return to_contact_out(contact)


# DELETE /contacts/{contact_id}
# Soft-deletes a contact instead of permanently removing its database row.
@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: str,
    db: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    # Verify ownership and mark the contact as deleted.
    contact_service.delete_contact(db, user.user_id, contact_id)

    # Return HTTP 204 No Content to indicate successful deletion.
    return Response(status_code=status.HTTP_204_NO_CONTENT)