# Admin Points API Documentation

This document provides comprehensive documentation for the Admin Points API endpoints, including detailed request/response examples and usage scenarios.

## Overview

The Admin Points API allows administrators to manage member point balances, including adding points, deducting points, viewing balances, and monitoring point transactions. All endpoints require admin authentication via JWT token.

**Base URL:** `/admin/points`  
**Authentication:** Bearer Token (Admin JWT)

## Endpoints

### 1. Add Points to Member

**POST** `/admin/points/add`

Add points to a member's account with optional expiration date. Points are managed using FIFO (First In, First Out) logic for expiration tracking.

#### Request Body

```json
{
  "memberId": "clm123456789",
  "amount": 500,
  "description": "Monthly activity bonus",
  "expirationDays": 365
}
```

#### Request Parameters

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `memberId` | string | Yes | Unique identifier of the member | `"clm123456789"` |
| `amount` | number | Yes | Number of points to add (positive integer) | `500` |
| `description` | string | Yes | Reason for adding points | `"Monthly activity bonus"` |
| `expirationDays` | number | No | Days until expiration (1-3650) | `365` |

#### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "message": "Successfully added 500 points"
  },
  "message": "Points added successfully",
  "meta": {
    "timestamp": "2023-12-01T10:30:00.000Z",
    "traceId": "trace-abc123"
  }
}
```

#### Error Responses

**400 Bad Request - Validation Error**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "amount": ["amount must be a positive number"]
    }
  },
  "meta": {
    "timestamp": "2023-12-01T10:30:00.000Z",
    "traceId": "trace-abc123"
  }
}
```

**404 Not Found - Member Not Found**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Member not found",
    "details": {
      "memberId": "clm123456789"
    }
  },
  "meta": {
    "timestamp": "2023-12-01T10:30:00.000Z",
    "traceId": "trace-abc123"
  }
}
```

#### Usage Examples

**Adding bonus points with expiration:**
```bash
curl -X POST "https://api.example.com/admin/points/add" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "clm123456789",
    "amount": 500,
    "description": "Monthly activity bonus",
    "expirationDays": 365
  }'
```

**Adding permanent points (no expiration):**
```bash
curl -X POST "https://api.example.com/admin/points/add" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "clm987654321",
    "amount": 1000,
    "description": "Welcome bonus for new member"
  }'
```

---

### 2. Deduct Points from Member

**POST** `/admin/points/deduct`

Deduct points from a member's account using FIFO logic. Points are deducted from the oldest non-expired points first.

#### Request Body

```json
{
  "memberId": "clm123456789",
  "amount": 200,
  "description": "Penalty for policy violation"
}
```

#### Request Parameters

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `memberId` | string | Yes | Unique identifier of the member | `"clm123456789"` |
| `amount` | number | Yes | Number of points to deduct (positive integer) | `200` |
| `description` | string | Yes | Reason for deducting points | `"Penalty for policy violation"` |

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Successfully deducted 200 points"
  },
  "message": "Points deducted successfully",
  "meta": {
    "timestamp": "2023-12-01T10:35:00.000Z",
    "traceId": "trace-def456"
  }
}
```

#### Error Responses

**400 Bad Request - Insufficient Points**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_POINTS",
    "message": "Insufficient points",
    "details": {
      "requested": 200,
      "available": 150
    }
  },
  "meta": {
    "timestamp": "2023-12-01T10:35:00.000Z",
    "traceId": "trace-def456"
  }
}
```

#### Usage Examples

**Deducting points as penalty:**
```bash
curl -X POST "https://api.example.com/admin/points/deduct" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "clm123456789",
    "amount": 200,
    "description": "Penalty for policy violation"
  }'
```

---

### 3. Get Member Point Balance

**GET** `/admin/points/balance/{memberId}`

Retrieve comprehensive point balance information for a specific member.

#### Path Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `memberId` | string | Yes | Unique identifier of the member | `clm123456789` |

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "memberId": "clm123456789",
    "totalEarned": 2000,
    "totalDeducted": 500,
    "totalExpired": 100,
    "totalExchanged": 300,
    "availableBalance": 1100,
    "lastUpdated": "2023-12-01T10:40:00.000Z"
  },
  "message": "Point balance retrieved successfully",
  "meta": {
    "timestamp": "2023-12-01T10:40:00.000Z",
    "traceId": "trace-ghi789"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `memberId` | string | Member's unique identifier |
| `totalEarned` | number | Total points earned by the member |
| `totalDeducted` | number | Total points deducted from the member |
| `totalExpired` | number | Total points that have expired |
| `totalExchanged` | number | Total points exchanged for privileges |
| `availableBalance` | number | Current available point balance |
| `lastUpdated` | string | Timestamp of last balance update |

#### Usage Example

```bash
curl -X GET "https://api.example.com/admin/points/balance/clm123456789" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

### 4. Get Member Point History

**GET** `/admin/points/history/{memberId}`

Retrieve paginated point transaction history for a specific member.

#### Path Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `memberId` | string | Yes | Unique identifier of the member | `clm123456789` |

#### Query Parameters

| Parameter | Type | Required | Default | Description | Example |
|-----------|------|----------|---------|-------------|---------|
| `page` | number | No | 1 | Page number for pagination | `1` |
| `limit` | number | No | 10 | Number of items per page | `20` |

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "clp123456789",
      "memberId": "clm123456789",
      "amount": 500,
      "signedAmount": 500,
      "type": "EARNED",
      "description": "Monthly activity bonus",
      "expiresAt": "2024-12-01T00:00:00.000Z",
      "isExpired": false,
      "createdAt": "2023-12-01T10:30:00.000Z"
    },
    {
      "id": "clp987654321",
      "memberId": "clm123456789",
      "amount": 200,
      "signedAmount": -200,
      "type": "DEDUCTED",
      "description": "Penalty for policy violation",
      "expiresAt": null,
      "isExpired": false,
      "createdAt": "2023-11-30T15:20:00.000Z"
    }
  ],
  "message": "Point history retrieved successfully",
  "meta": {
    "timestamp": "2023-12-01T10:45:00.000Z",
    "traceId": "trace-jkl012",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Transaction Types

| Type | Description | Signed Amount |
|------|-------------|---------------|
| `EARNED` | Points added to account | Positive |
| `DEDUCTED` | Points removed from account | Negative |
| `EXPIRED` | Points that have expired | Negative |
| `EXCHANGED` | Points used for privilege exchange | Negative |

#### Usage Examples

**Get first page with default limit:**
```bash
curl -X GET "https://api.example.com/admin/points/history/clm123456789" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Get specific page with custom limit:**
```bash
curl -X GET "https://api.example.com/admin/points/history/clm123456789?page=2&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

### 5. Get Expiring Points

**GET** `/admin/points/expiring`

Retrieve all points across all members that are expiring within the specified number of days.

#### Query Parameters

| Parameter | Type | Required | Default | Description | Example |
|-----------|------|----------|---------|-------------|---------|
| `days` | number | No | 30 | Number of days to look ahead | `7` |

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "clp123456789",
      "memberId": "clm123456789",
      "amount": 500,
      "signedAmount": 500,
      "type": "EARNED",
      "description": "Welcome bonus",
      "expiresAt": "2023-12-15T00:00:00.000Z",
      "isExpired": false,
      "createdAt": "2022-12-15T00:00:00.000Z"
    },
    {
      "id": "clp987654321",
      "memberId": "clm987654321",
      "amount": 200,
      "signedAmount": 200,
      "type": "EARNED",
      "description": "Activity bonus",
      "expiresAt": "2023-12-20T00:00:00.000Z",
      "isExpired": false,
      "createdAt": "2022-12-20T00:00:00.000Z"
    }
  ],
  "message": "Expiring points retrieved successfully",
  "meta": {
    "timestamp": "2023-12-01T10:50:00.000Z",
    "traceId": "trace-mno345"
  }
}
```

#### Usage Examples

**Get points expiring in next 30 days (default):**
```bash
curl -X GET "https://api.example.com/admin/points/expiring" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Get points expiring in next 7 days:**
```bash
curl -X GET "https://api.example.com/admin/points/expiring?days=7" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

## Common Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized access"
  },
  "meta": {
    "timestamp": "2023-12-01T10:00:00.000Z",
    "traceId": "trace-xyz789"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Forbidden access"
  },
  "meta": {
    "timestamp": "2023-12-01T10:00:00.000Z",
    "traceId": "trace-xyz789"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error"
  },
  "meta": {
    "timestamp": "2023-12-01T10:00:00.000Z",
    "traceId": "trace-xyz789"
  }
}
```

---

## Authentication

All Admin Points API endpoints require authentication using a JWT token obtained from the admin login endpoint.

### Getting an Admin Token

**POST** `/admin/auth/login`

```json
{
  "emailOrUsername": "admin@example.com",
  "password": "AdminPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  },
  "message": "Login successful"
}
```

### Using the Token

Include the token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Rate Limiting

API endpoints may be subject to rate limiting. If you exceed the rate limit, you'll receive a 429 Too Many Requests response.

---

## Best Practices

1. **Always validate member existence** before adding or deducting points
2. **Use descriptive descriptions** for point transactions for audit purposes
3. **Monitor expiring points** regularly to notify members
4. **Handle insufficient points** gracefully when deducting
5. **Use pagination** for large point history requests
6. **Implement proper error handling** for all API calls
7. **Log all point operations** for audit trails

---

## FIFO Point Management

The system uses FIFO (First In, First Out) logic for point management:

- **Point Addition**: New points are added with expiration dates (if specified)
- **Point Deduction**: Points are deducted from the oldest non-expired points first
- **Point Expiration**: Points expire automatically based on their expiration date
- **Balance Calculation**: Available balance excludes expired points

This ensures fair point usage and proper expiration handling.