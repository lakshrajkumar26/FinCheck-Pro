# API Endpoints (Expense Management Backend)

BASE URL: `http://localhost:4000/api`

---

## AUTH (new)
> Handles registration, login, forgot/reset password, and "me" endpoint.

### POST /api/auth/register
- Auth: **No**
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "name": "John Founder",
  "email": "john@example.com",
  "password": "password123",
  "role": "founder",
  "companyId": 1
}
