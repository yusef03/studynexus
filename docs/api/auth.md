# Auth API

Base path: `/api/v1/auth`

---

## POST /register

Create a new user account. Restricted to `@stud.hs-hannover.de` email addresses only.

**Request body**
```json
{
  "email": "max.mustermann@stud.hs-hannover.de",
  "password": "securepassword123",
  "full_name": "Max Mustermann",
  "preferred_language": "de",
  "matrikelnummer": "1234567",
  "birth_date": "2000-05-15",
  "hochschule": "Hochschule Hannover"
}
```

**Response 201**
```json
{
  "id": "uuid",
  "email": "max.mustermann@stud.hs-hannover.de",
  "full_name": "Max Mustermann",
  "preferred_language": "de",
  "matrikelnummer": "1234567",
  "birth_date": "2000-05-15",
  "hochschule": "Hochschule Hannover",
  "is_active": true,
  "is_premium": false,
  "created_at": "2026-04-18T00:00:00Z"
}
```

**Response 409** – Email already registered.
**Response 422** – Validation error (invalid email domain, missing fields).

---

## POST /verify

Verify a user's email address using a 6-digit code sent via Resend.

**Request body**
```json
{
  "email": "max.mustermann@stud.hs-hannover.de",
  "code": "123456"
}
```

**Response 200** – Email verified successfully.
**Response 400** – Invalid or expired verification code.
**Response 404** – User not found.

---

## POST /login

Authenticate and receive a JWT access token. Token is set as an `httpOnly` cookie by the Next.js API proxy.

**Request body**
```json
{
  "email": "max.mustermann@stud.hs-hannover.de",
  "password": "securepassword123"
}
```

**Response 200**
```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

**Response 401** – Invalid email or password.
**Response 403** – Account not verified or deactivated.

---

## POST /logout

Invalidate the current session. The Next.js API proxy clears the `httpOnly` cookie.

**Response 204** – No content.

---

## Security Notes

- **Email Domain Validation:** Registration enforces `@stud.hs-hannover.de` domain via Pydantic validator (see ADR-008).
- **Token Lifetime:** JWT access tokens are valid for 7 days (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` in `.env`).
- **Cookie Security:** `httpOnly`, `sameSite=lax`, `secure` in production. Cookie lifetime matches token lifetime.
- **CSRF Protection:** All mutating requests require `x-studynexus-client: true` header (validated by Next.js middleware).
