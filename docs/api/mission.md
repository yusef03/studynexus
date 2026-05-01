# Mission Control API

Base URL: `/api/v1/mission`

---

## Tasks (`/mission/tasks`)

Tasks represent Kanban board items: assignments, exam preparations, and general to-dos.

### GET /mission/tasks/
Returns all tasks for the authenticated user.

**Response 200**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Zusammenfassung SE",
    "description": "Kapitel 1-5",
    "status": "TODO",
    "priority": "HIGH",
    "due_date": "2026-05-15",
    "is_submission": false,
    "module_id": "uuid",
    "created_at": "2026-04-20T10:00:00Z"
  }
]
```

**Response 401** – Not authenticated

---

### POST /mission/tasks/
Create a new task.

**Request body**
```json
{
  "title": "Mathe Übung 3",
  "description": "Aufgaben 1-5",
  "status": "TODO",
  "priority": "MEDIUM",
  "due_date": "2026-05-10",
  "is_submission": true,
  "module_id": "uuid"
}
```

**Response 201** – TaskResponse
**Response 401** – Not authenticated
**Response 422** – Validation error

---

### PUT /mission/tasks/{task_id}
Update a task (status, priority, title, etc.).

**Request body** (all fields optional)
```json
{
  "status": "IN_PROGRESS",
  "priority": "HIGH"
}
```

**Response 200** – Updated TaskResponse
**Response 404** – Task not found

---

### DELETE /mission/tasks/{task_id}
Delete a task.

**Response 204** – Deleted
**Response 404** – Task not found

---

## Data Models

### TaskStatus
`TODO` | `IN_PROGRESS` | `EXAM_READY` | `DONE`

### TaskPriority
`LOW` | `MEDIUM` | `HIGH`

---

## Events (`/mission/events`)

Events represent schedule entries: lectures, exams, work shifts, focus sessions, and private appointments.

### GET /mission/events/?semester_tag={tag}
Returns all events for the authenticated user filtered by semester tag.

**Query Parameters:**
- `semester_tag` (required): e.g. `WiSe2425`

**Response 200**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Vorlesung Software Engineering",
    "event_type": "LECTURE",
    "day_of_week": 0,
    "event_date": null,
    "start_time": "10:00:00",
    "end_time": "11:30:00",
    "is_recurring": true,
    "is_hidden": false,
    "location": "Geb. 1, R. 238",
    "lecturer": "Prof. Müller",
    "module_id": "uuid",
    "semester_tag": "WiSe2425",
    "created_at": "2026-04-20T10:00:00Z"
  }
]
```

---

### POST /mission/events/
Create a new event. Includes collision detection.

**Request body**
```json
{
  "title": "Computergrafik",
  "event_type": "LECTURE",
  "day_of_week": 1,
  "start_time": "10:00",
  "end_time": "11:30",
  "is_recurring": true,
  "location": "Geb. 2, R. 105",
  "lecturer": "Prof. Schmidt",
  "module_id": "uuid",
  "semester_tag": "WiSe2425"
}
```

**Response 201** – EventResponse
**Response 409** – Collision detected (soft warning, includes `collisionData` with conflicting event title)
**Response 422** – Validation error

---

### PUT /mission/events/{event_id}
Update an event.

**Response 200** – Updated EventResponse
**Response 404** – Event not found
**Response 409** – Collision detected

---

### DELETE /mission/events/{event_id}
Delete an event.

**Response 204** – Deleted
**Response 404** – Event not found

---

## Data Models

### EventType
`LECTURE` | `EXERCISE` | `TUTORIAL` | `SEMINAR` | `PRACTICUM` | `CUSTOM_STUDY` | `FOCUS` | `EXAM` | `WORK` | `LIFE`

### Collision Detection
When creating or updating an event, the backend checks for time overlaps with existing events on the same day. If a collision is found:
- The event is still saved (soft collision)
- Response status is `409 Conflict`
- The `collisionData` field contains `|COLLISION|{conflicting_title}` for UI display

### Semester Binding
All events are bound to a `semester_tag` (e.g. `WiSe2425`). This ensures historical schedules remain intact when a new semester begins. The frontend filters events by the active semester tag.

### Ghosting Mode
Events with `is_hidden = true` are excluded from normal display. A UI toggle "Show ghost blocks" reveals them as semi-transparent, dashed cards. Useful for temporarily pausing attendance without losing the schedule entry.
