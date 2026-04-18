# Auth API

Base path: `/api/v1/auth`

---

## POST /register

Create a new user account.

**Request body**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "Max Mustermann",
  "preferred_language": "de"
}
```

**Response 201**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "Max Mustermann",
  "preferred_language": "de",
  "is_active": true,
  "is_premium": false,
  "created_at": "2026-04-18T00:00:00Z"
}
```

**Response 409** – Email already registered.  
**Response 422** – Validation error (invalid email, missing fields).

---

## POST /login

Authenticate and receive a JWT access token.

**Request body**
```json
{
  "email": "user@example.com",
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
**Response 403** – Account deactivated.

---

## POST /logout

Invalidate the current session (client-side only for now).

> JWT is stateless. The client must discard the token. Issue #4 will add
> Redis-based server-side blacklisting.

**Response 204** – No content.
