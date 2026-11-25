from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database import get_db
from app.models.organization import Organization
from app.models.user import User
from app.schemas.settings import OrganizationSettingsRead, OrganizationSettingsUpdate
from app.services.settings_service import (
    get_organization_settings,
    update_organization_settings,
)


router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=OrganizationSettingsRead)
def read_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Organization:
    organization = get_organization_settings(db, current_user.organization_id)
    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    return organization


@router.patch("", response_model=OrganizationSettingsRead)
def update_settings(
    request: OrganizationSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Organization:
    organization = get_organization_settings(db, current_user.organization_id)
    if organization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    return update_organization_settings(db, organization, request)
