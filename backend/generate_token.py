import asyncio
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.core.security import create_access_token

def generate_token():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "yusef.bach@stud.hs-hannover.de").first()
    if user:
        token = create_access_token(str(user.id), is_admin=user.is_admin)
        print(token)
    else:
        print("User not found")
    db.close()

if __name__ == "__main__":
    generate_token()
