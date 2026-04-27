from datetime import datetime, date
from datetime import time as time_obj
from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from app.models.event import EventType

class EventBase(BaseModel):
    title: str
    event_type: EventType = EventType.CUSTOM_STUDY
    semester_tag: Optional[str] = None
    is_recurring: bool = False
    day_of_week: Optional[int] = None
    event_date: Optional[date] = None
    start_time: Optional[time_obj] = None
    end_time: Optional[time_obj] = None
    location: Optional[str] = None
    lecturer: Optional[str] = None
    is_hidden: bool = False
    module_id: Optional[UUID] = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    event_type: Optional[EventType] = None
    semester_tag: Optional[str] = None
    is_recurring: Optional[bool] = None
    day_of_week: Optional[int] = None
    event_date: Optional[date] = None
    start_time: Optional[time_obj] = None
    end_time: Optional[time_obj] = None
    location: Optional[str] = None
    lecturer: Optional[str] = None
    is_hidden: Optional[bool] = None
    module_id: Optional[UUID] = None

class EventResponse(EventBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
