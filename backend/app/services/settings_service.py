from sqlalchemy.orm import Session

from app.models.organization import Organization
from app.schemas.settings import OrganizationSettingsUpdate


def get_organization_settings(db: Session, organization_id: int) -> Organization | None:
    return db.get(Organization, organization_id)


def update_organization_settings(
    db: Session,
    organization: Organization,
    request: OrganizationSettingsUpdate,
) -> Organization:
    organization.default_low_stock_threshold = request.default_low_stock_threshold
    db.commit()
    db.refresh(organization)
    return organization
