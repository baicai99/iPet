# Users Schema Test Failures (2025-12-29)

## Purpose
Freeze failing inputs and test output for traceable schema remediation.

## Command
```
npm --prefix backend-ui run test:unit -- src/api/schemas/users.test.ts
```

## Failing Inputs
### UserSchema valid user (should pass but failed)
```json
{
  "id": "1",
  "email": "test@example.com",
  "displayName": "Test User",
  "role": "admin",
  "status": "active",
  "petsCount": 5,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### UserListSchema list (should pass but failed)
```json
{
  "items": [
    {
      "id": "1",
      "email": "test@example.com",
      "displayName": "Test User",
      "role": "admin",
      "status": "active",
      "petsCount": 5,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### GuestStatsSchema valid stats (should pass but failed)
```json
{
  "totalGuests": 100,
  "activeGuests": 50,
  "inactiveGuests": 50
}
```

## Output
```
> backend-ui@0.0.0 test:unit
> vitest src/api/schemas/users.test.ts

 RUN  v4.0.16 /Users/zhengjiyuan/Desktop/iPet/backend-ui

 ❯ src/api/schemas/users.test.ts (7 tests | 3 failed) 8ms
     × should parse valid user data
     ✓ should reject invalid user data
     ✓ should validate email format
     × should parse user list with pagination
     ✓ should reject invalid pagination data
     × should parse valid guest stats
     ✓ should reject negative numbers

 FAIL  src/api/schemas/users.test.ts > UserSchema > should parse valid user data
 AssertionError: expected false to be true

 FAIL  src/api/schemas/users.test.ts > UserListSchema > should parse user list with pagination
 AssertionError: expected false to be true

 FAIL  src/api/schemas/users.test.ts > GuestStatsSchema > should parse valid guest stats
 AssertionError: expected false to be true
```
