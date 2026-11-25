import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.invitation import OrganizationInvitation
from app.models.organization import Organization
from app.models.user import User
from app.schemas.auth import InvitationCreate, RegisterRequest


def create_user(db: Session, request: RegisterRequest) -> User:
    email = str(request.email).lower()
    if request.invitation_token:
        token_hash = hashlib.sha256(request.invitation_token.encode()).hexdigest()
        invitation = db.scalar(
            select(OrganizationInvitation)
            .where(OrganizationInvitation.token_hash == token_hash)
            .with_for_update()
        )
        if invitation is None or invitation.email != email:
            raise ValueError("Invalid organization invitation")
        expires_at = invitation.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if invitation.accepted_at is not None or expires_at <= datetime.now(timezone.utc):
            raise ValueError("Organization invitation has expired or was already accepted")
        organization_id = invitation.organization_id
        invitation.accepted_at = datetime.now(timezone.utc)
    else:
        organization = Organization(name=request.organization_name)
        db.add(organization)
        db.flush()
        organization_id = organization.id

    user = User(
        email=email,
        full_name=request.full_name,
        hashed_password=hash_password(request.password),
        organization_id=organization_id,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(user)
    return user


def create_invitation(
    db: Session,
    user: User,
    request: InvitationCreate,
) -> tuple[OrganizationInvitation, str]:
    email = str(request.email).lower()
    if get_user_by_email(db, email) is not None:
        raise ValueError("A user with this email already exists")

    pending = db.scalar(
        select(OrganizationInvitation).where(
            OrganizationInvitation.organization_id == user.organization_id,
            OrganizationInvitation.email == email,
            OrganizationInvitation.accepted_at.is_(None),
        )
    )
    if pending is not None:
        expires_at = pending.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at > datetime.now(timezone.utc):
            raise ValueError("A pending invitation already exists for this email")

    token = secrets.token_urlsafe(32)
    invitation = OrganizationInvitation(
        email=email,
        organization_id=user.organization_id,
        invited_by_user_id=user.id,
        token_hash=hashlib.sha256(token.encode()).hexdigest(),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation, token


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower()))


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None or not user.is_active or not verify_password(password, user.hashed_password):
        return None
    return user
