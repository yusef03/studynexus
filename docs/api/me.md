# User Profile API

Base URL: `/api/v1/me`

All endpoints require Bearer JWT authentication.

---

## GET /me
Returns the current authenticated user's profile.

**Response 200**
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

**Response 401** – Not authenticated

---

## PUT /me/profile
Update profile fields.

**Request body** (all fields optional)
```json
{
  "full_name": "Max Mustermann",
  "preferred_language": "en"
}
```

**Response 200** – Updated UserResponse
**Response 401** – Not authenticated

---

## PUT /me/password
Change the current user's password. Requires the old password for verification.

**Request body**
```json
{
  "old_password": "currentPassword123",
  "new_password": "newSecurePassword456"
}
```

**Response 204** – Password changed successfully (no content)
**Response 400** – Old password is incorrect
**Response 401** – Not authenticated
**Response 422** – Validation error (e.g., new password too short)
