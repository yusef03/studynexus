# Study Plan API

Base URL: `/api/v1`

---

## Public Endpoints

### GET /universities
Returns all universities.

**Response 200**
```json
[{ "id": "uuid", "name": "Hochschule Hannover", "kuerzel": "HSH", "stadt": "Hannover", "bundesland": "Niedersachsen", "typ": "FH" }]
```

---

### GET /universities/{id}/faculties
Returns faculties for a university.

**Response 200** – list of faculties  
**Response 404** – university not found

---

### GET /faculties/{id}/programs
Returns degree programs for a faculty.

**Response 200** – list of programs  
**Response 404** – faculty not found

---

### GET /programs/{id}/exam-regulations
Returns exam regulations for a program.

**Response 200** – list of exam regulations  
**Response 404** – program not found

---

### GET /exam-regulations/{id}/modules
Returns modules grouped by `semester_empfehlung`.

**Response 200**
```json
[{ "semester": 1, "modules": [...] }]
```
**Response 404** – exam regulation not found

---

## Protected Endpoints (Bearer JWT required)

### POST /me/program
Select a degree program.

**Request**
```json
{ "exam_regulation_id": "uuid", "start_semester": "WS2024/25" }
```
**Response 201** – UserProgramResponse  
**Response 404** – exam regulation not found  
**Response 409** – program already selected (use PUT)

---

### GET /me/program
Get current program. Auto-creates StudentModules for all PFLICHT modules (idempotent).

**Response 200** – UserProgramResponse with nested `exam_regulation` and `program`  
**Response 404** – no program selected

---

### PUT /me/program
Change current program.

**Request** – same as POST  
**Response 200** – updated UserProgramResponse  
**Response 404** – no program selected

---

### GET /me/modules
Returns all student modules grouped by semester.

**Response 200**
```json
[{ "semester": 1, "modules": [StudentModuleResponse] }]
```

---

### POST /me/modules
Add a WAHLPFLICHT module (by `module_id`) or a custom ERGAENZEND module (by `custom_name` + `custom_ects`). Exactly one of the two forms must be provided.

**Request (WAHLPFLICHT)**
```json
{ "module_id": "uuid" }
```

**Request (custom ERGAENZEND)**
```json
{ "custom_name": "Zusatzkurs", "custom_ects": 3 }
```

**Response 201** – StudentModuleResponse  
**Response 400** – no program selected, or module is PFLICHT  
**Response 404** – module not found  
**Response 409** – module already in study plan  
**Response 422** – invalid request body

---

### PUT /me/modules/{id}
Update status, note, dates, or semester of a student module.

**Request**
```json
{ "status": "PASSED", "note": 2.3 }
```

**Validation rules:**
- `note` must be between 1.0 and 5.0
- `status = PASSED` with `note > 4.0` → rejected
- `status = PASSED` with `note = 5.0` → rejected with hint to use FAILED
- `note` on an ungraded module (`ist_benotet = false`) → rejected
- `status = FAILED` → `versuch_nummer` auto-incremented; rejected if it would exceed `max_versuche`

**Response 200** – updated StudentModuleResponse  
**Response 404** – module not found  
**Response 409** – max attempts exceeded  
**Response 422** – validation error

---

### DELETE /me/modules/{id}
Remove a module from the study plan. Not allowed for PASSED modules.

**Response 204** – deleted  
**Response 404** – module not found  
**Response 409** – module is PASSED

---

## Data Models

### ModulTyp
`PFLICHT` | `WAHLPFLICHT` | `ERGAENZEND`

### StudiengangStatus
`PLANNED` | `REGISTERED` | `PASSED` | `FAILED`
