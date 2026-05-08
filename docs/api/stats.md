# Stats API

Base URL: `/api/v1`

---

## GET /me/stats

Returns aggregated statistics for the authenticated user.  
Requires Bearer JWT.

**Response 200**
```json
{
  "gpa": 2.15,
  "erreichte_ects": 90,
  "gesamt_ects": 180,
  "fortschritt_prozent": 50.0,
  "bestandene_module": 15,
  "nicht_bestandene_module": 1,
  "offene_module": 16,
  "sem1_complete": true,
  "sem2_complete": false,
  "vorpruefung_bestanden": false,
  "sem4_zugaenglich": true,
  "sem5_zugaenglich": false,
  "sem6_zugaenglich": false,
  "ba_zulassung_eligible": false,
  "ects_fuer_ba": 90
}
```

### Core Fields

| Field | Type | Description |
|---|---|---|
| `gpa` | float \| null | Weighted GPA. `null` if no graded passed modules yet. |
| `erreichte_ects` | int | Sum of ECTS from all PASSED modules. |
| `gesamt_ects` | int | Total ECTS of the enrolled degree program. 0 if no program selected. |
| `fortschritt_prozent` | float | `erreichte_ects / gesamt_ects * 100`, rounded to 1 decimal. |
| `bestandene_module` | int | Count of StudentModules with `status = PASSED`. |
| `nicht_bestandene_module` | int | Count of StudentModules with `status = FAILED`. |
| `offene_module` | int | Count of StudentModules with `status = PLANNED` or `REGISTERED`. |

### Milestone Fields (Sprint 4 Phase 2 — BIN PO §6)

All milestone fields are `null` if the user has no program or if the program has no
`semester_empfehlung`-based PFLICHT structure (i.e., non-BIN programs in future sprints).

| Field | Type | Description |
|---|---|---|
| `sem1_complete` | bool \| null | All PFLICHT modules with `semester_empfehlung=1` are PASSED. |
| `sem2_complete` | bool \| null | All PFLICHT modules with `semester_empfehlung=2` are PASSED. |
| `vorpruefung_bestanden` | bool \| null | Bachelor-Vorprüfung: all Sem 1+2+3 PFLICHT modules PASSED (§6). |
| `sem4_zugaenglich` | bool \| null | `sem1_complete` — Sem 4 exams accessible per PO §6. |
| `sem5_zugaenglich` | bool \| null | `sem1_complete AND sem2_complete`. |
| `sem6_zugaenglich` | bool \| null | `vorpruefung_bestanden`. |
| `ba_zulassung_eligible` | bool \| null | `vorpruefung_bestanden AND ects_fuer_ba >= 134`. |
| `ects_fuer_ba` | int \| null | Current earned ECTS (same as `erreichte_ects`, exposed separately for BA progress bar). |

### BIN PO §6 — Exact Module Groups

Computed dynamically from the exam_regulation's PFLICHT modules, not hardcoded:
- **Sem 1** (semester_empfehlung=1): BIN-100, BIN-101, BIN-102, BIN-103, BIN-104, BIN-116
- **Sem 2** (semester_empfehlung=2): BIN-105, BIN-106, BIN-107, BIN-108, BIN-109
- **Sem 3** (semester_empfehlung=3): BIN-110, BIN-111, BIN-112, BIN-113, BIN-114, BIN-115
- **Vorprüfung** = all 17 modules above PASSED

### GPA Formula

```
benotete_bestanden = modules where status=PASSED AND ist_benotet=True AND note IS NOT NULL
gpa = round(sum(note * ects * gewichtung) / sum(ects * gewichtung), 2)
```

Only graded, passed modules with a note and `gewichtung > 0` contribute to GPA.
FAILED, PLANNED, REGISTERED, and ungraded modules are excluded.
Modules with `gewichtung = 0` (BIN-114, BIN-116, BIN-204, BIN-206, BIN-208) are excluded.
