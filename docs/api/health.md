# Health API

Base path: `/api/v1`

## GET /ping

Lightweight liveness check – no database involved.

**Response 200**
```json
{ "status": "ok" }
```

---

## GET /health

Full readiness check including database connectivity.

**Response 200**
```json
{
  "status": "ok",
  "database": "connected",
  "service": "StudyNexus API"
}
```

**Response 500** – Database unreachable.
