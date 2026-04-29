from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, ChangePasswordRequest
from app.core.dependencies import get_current_user
from app.core.security import verify_password, hash_password

router = APIRouter(prefix="/me", tags=["me"])

@router.get("", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

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
    if payload.birth_date is not None:
        current_user.birth_date = payload.birth_date
    if payload.university is not None:
        current_user.university = payload.university
    if payload.profile_picture_url is not None:
        current_user.profile_picture_url = payload.profile_picture_url

    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Das alte Passwort ist nicht korrekt.",
        )
    
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return None
