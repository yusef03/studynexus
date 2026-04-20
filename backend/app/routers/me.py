from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/me", tags=["me"])

@router.put("/profile", response_model=UserResponse)
def update_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.matrikelnummer is not None:
        # Check uniqueness if changed
        if payload.matrikelnummer != current_user.matrikelnummer:
            existing = db.query(User).filter(User.matrikelnummer == payload.matrikelnummer).first()
            if existing:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Matrikelnummer is already registered")
        current_user.matrikelnummer = payload.matrikelnummer

    if payload.full_name is not None:
        current_user.full_name = payload.full_name

    db.commit()
    db.refresh(current_user)
    return current_user
