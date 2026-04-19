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
  "offene_module": 16
}
```

### Field Definitions

| Field | Type | Description |
|---|---|---|
| `gpa` | float \| null | Weighted GPA. `null` if no graded passed modules yet. |
| `erreichte_ects` | int | Sum of ECTS from all PASSED modules. |
| `gesamt_ects` | int | Total ECTS of the enrolled degree program. 0 if no program selected. |
| `fortschritt_prozent` | float | `erreichte_ects / gesamt_ects * 100`, rounded to 1 decimal. |
| `bestandene_module` | int | Count of StudentModules with `status = PASSED`. |
| `nicht_bestandene_module` | int | Count of StudentModules with `status = FAILED`. |
| `offene_module` | int | Count of StudentModules with `status = PLANNED` or `REGISTERED`. |

### GPA Formula

```
benotete_bestanden = modules where status=PASSED AND ist_benotet=True AND note IS NOT NULL
gpa = round(sum(note * ects) / sum(ects), 2)
```

Only graded, passed modules with a note contribute to GPA. FAILED, PLANNED, REGISTERED, and ungraded modules are excluded.
