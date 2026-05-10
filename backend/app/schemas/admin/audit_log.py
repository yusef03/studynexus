"""Audit log schemas — Sprint 5 Phase 10."""
from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID

from pydantic import BaseModel


class AuditLogItem(BaseModel):
    id: UUID
    admin_id: Optional[UUID]
    admin_name: Optional[str]
    action: str
    entity_type: str
    entity_id: Optional[UUID]
    entity_label: Optional[str]
    old_value: Optional[Any]
    new_value: Optional[Any]
    reason: Optional[str]
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    items: List[AuditLogItem]
    total: int
    page: int
    page_size: int
    total_pages: int
