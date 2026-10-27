import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from shared_package.db.get_session import get_session
from shared_package.sync_function.auth_dep import get_current_user
from shared_package.sync_function.email_services import send_report_email
from shared_package.sync_function.report_pdf import (
    build_report_pdf,
    range_label,
    range_slug,
)
from shared_package.sync_function.reports import build_report
from app.portal.models import ReportEmailRequest, ReportOut

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["reports"])


# GET /reports?days=30   (leave days out for all time)
@router.get("", response_model=ReportOut)
def get_report(
    days: int | None = Query(default=None, ge=1, le=365),
    db: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    return ReportOut(**build_report(db, user.user_id, days))


# GET /reports/pdf?days=30   downloads the report as a PDF
@router.get("/pdf")
def download_report(
    days: int | None = Query(default=None, ge=1, le=365),
    db: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    report = build_report(db, user.user_id, days)
    pdf = build_report_pdf(report, days=days, user_name=user.full_name)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="clientdesk-report-{range_slug(days)}.pdf"'
        },
    )


# POST /reports/email   body: {"email": "...", "days": 30}
@router.post("/email")
def email_report(
    body: ReportEmailRequest,
    db: Session = Depends(get_session),
    user=Depends(get_current_user),
):
    report = build_report(db, user.user_id, body.days)
    pdf = build_report_pdf(report, days=body.days, user_name=user.full_name)
    try:
        send_report_email(
            to=str(body.email),
            pdf=pdf,
            filename=f"clientdesk-report-{range_slug(body.days)}.pdf",
            range_label=range_label(body.days),
            user_name=user.full_name,
        )
    except Exception:
        logger.exception("Could not send the report email")
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            "We couldn't send the email. Try again in a moment.",
        )
    return {"message": f"Report sent to {body.email}"}