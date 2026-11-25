from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.auth import InvitationCreate, InvitationResponse
from app.services.auth_service import create_invitation


router = APIRouter(prefix="/organizations", tags=["organizations"])


@router.post(
    "/invitations",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
def invite_user(
    request: InvitationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InvitationResponse:
    try:
        invitation, token = create_invitation(db, current_user, request)
    except ValueError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    return InvitationResponse(
        invitation_token=token,
        expires_at=invitation.expires_at.isoformat(),
    )
