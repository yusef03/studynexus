from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.event import Event
from app.schemas.event import EventCreate, EventUpdate, EventResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/mission/events", tags=["events"])

@router.get("/", response_model=List[EventResponse])
def get_events(
    semester_tag: Optional[str] = Query(None),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = db.query(Event).filter(Event.user_id == current_user.id)
    if semester_tag:
        query = query.filter(Event.semester_tag == semester_tag)
    return query.all()

def check_overlap(event1_start, event1_end, event2_start, event2_end):
    if not (event1_start and event1_end and event2_start and event2_end): return False
    return max(event1_start, event2_start) < min(event1_end, event2_end)

@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreate, 
    force: bool = False,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if not force and payload.start_time and payload.end_time:
        conflicts = db.query(Event).filter(
            Event.user_id == current_user.id,
            Event.semester_tag == payload.semester_tag
        ).all()
        
        for c in conflicts:
            if c.is_hidden: continue
            
            day_conflict = False
            if payload.is_recurring and c.is_recurring:
                if payload.day_of_week == c.day_of_week: day_conflict = True
            elif not payload.is_recurring and not c.is_recurring:
                if payload.event_date == c.event_date: day_conflict = True
            elif not payload.is_recurring and c.is_recurring:
                if payload.event_date and payload.event_date.weekday() == c.day_of_week: day_conflict = True
            elif payload.is_recurring and not c.is_recurring:
                if c.event_date and c.event_date.weekday() == payload.day_of_week: day_conflict = True
                
            if day_conflict:
                if check_overlap(payload.start_time, payload.end_time, c.start_time, c.end_time):
                    raise HTTPException(status_code=409, detail=f"|COLLISION|{c.title}")
                    
    event = Event(**payload.model_dump(), user_id=current_user.id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.put("/{event_id}", response_model=EventResponse)
def update_event(event_id: UUID, payload: EventUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(event, key, value)
        
    db.commit()
    db.refresh(event)
    return event

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = db.query(Event).filter(Event.id == event_id, Event.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
