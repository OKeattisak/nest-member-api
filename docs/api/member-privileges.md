# Member Privileges API Documentation

This document provides comprehensive documentation for the Member Privileges API endpoints, including detailed request/response examples and usage scenarios.

## Overview

The Member Privileges API allows members to view available privileges, exchange points for privileges, and manage their owned privileges. All operations use FIFO (First In, First Out) logic for point deduction.

**Base URL:** `/member/privileges`  
**Authentication:** Bearer Token (Member JWT)

## Endpoints

### 1. Get Available Privileges

**GET** `/member/privileges/available`

Retrieve all active privileges that are available for point exchange.

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "clpr123456789",
      "name": "Premium Access",
      "description": "Access to premium features and exclusive content",
      "pointCost": 500,
      "validityDays": 30,
      "isActive": true
    },
    {
      "id": "clpr987654321",
      "name": "VIP Status",
      "description": "Permanent VIP status with lifetime benefits",
      "pointCost": 2000,
      "validityDays": null,
      "isActive": true
    },
    {
      "id": "clpr555666777",
      "name": "Early Access",
      "description": "Get early access to new features and updates",
      "pointCost": 300,
      "validityDays": 90,
      "isActive": true
    }
  ],
  "message": "Available privileges retrieved successfully",
  "meta": {
    "timestamp": "2023-12-01T13:00:00.000Z",
    "traceId": "trace-avail123"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique privilege identifier |
| `name` | string | Privilege name |
| `description` | string | Detailed privilege description |
| `pointCost` | number | Points required to exchange |
| `validityDays` | number | Days privilege remains valid (null = permanent) |
| `isActive` | boolean | Whether privilege is available for exchange |

#### Usage Example

```bash
curl -X GET "https://api.example.com/member/privileges/available" \
  -H "Authorization: Bearer YOUR_MEMBER_JWT_TOKEN"
```

---

### 2. Exchange Points for Privilege

**POST** `/member/privileges/exchange`

Exchange points for a specific privilege. Points are deducted using FIFO logic.

#### Request Body

```json
{
  "privilegeId": "clpr123456789"
}
```

#### Request Parameters

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `privilegeId` | string | Yes | Unique identifier of privilege to exchange | `"clpr123456789"` |

#### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "memberPrivilegeId": "clmp123456789",
    "privilegeName": "Premium Access",
    "pointsDeducted": 500,
    "expiresAt": "2024-01-01T00:00:00.000Z",
    "exchangedAt": "2023-12-01T13:05:00.000Z"
  },
  "message": "Privilege exchanged successfully",
  "meta": {
    "timestamp": "2023-12-01T13:05:00.000Z",
    "traceId": "trace-exchange123"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `memberPrivilegeId` | string | Unique identifier for the granted privilege |
| `privilegeName` | string | Name of the exchanged privilege |
| `pointsDeducted` | number | Number of points deducted from account |
| `expiresAt` | string | Expiration date (null for permanent privileges) |
| `exchangedAt` | string | Timestamp when exchange occurred |

#### Error Responses

**400 Bad Request - Insufficient Points**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_POINTS",
    "message": "Insufficient points for this exchange",
    "details": {
      "required": 500,
      "available": 300,
      "shortfall": 200
    }
  },
  "meta": {
    "timestamp": "2023-12-01T13:05:00.000Z",
    "traceId": "trace-exchange123"
  }
}
```

**404 Not Found - Privilege Not Available**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Privilege not found or not available for exchange",
    "details": {
      "privilegeId": "clpr123456789"
    }
  },
  "meta": {
    "timestamp": "2023-12-01T13:05:00.000Z",
    "traceId": "trace-exchange123"
  }
}
```

#### Usage Examples

**Exchange for Premium Access:**
```bash
curl -X POST "https://api.example.com/member/privileges/exchange" \
  -H "Authorization: Bearer YOUR_MEMBER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"privilegeId": "clpr123456789"}'
```

**Exchange for VIP Status:**
```bash
curl -X POST "https://api.example.com/member/privileges/exchange" \
  -H "Authorization: Bearer YOUR_MEMBER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"privilegeId": "clpr987654321"}'
```

---

### 3. Get Member Privileges

**GET** `/member/privileges/my-privileges`

Retrieve all privileges owned by the current member, including both active and expired privileges.

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "clmp123456789",
      "privilegeId": "clpr123456789",
      "privilegeName": "Premium Access",
      "privilegeDescription": "Access to premium features and exclusive content",
      "pointCost": 500,
      "grantedAt": "2023-12-01T13:05:00.000Z",
      "expiresAt": "2024-01-01T00:00:00.000Z",
      "isActive": true,
      "isExpired": false,
      "daysRemaining": 30
    },
    {
      "id": "clmp987654321",
      "privilegeId": "clpr555666777",
      "privilegeName": "Early Access",
      "privilegeDescription": "Get early access to new features and updates",
      "pointCost": 300,
      "grantedAt": "2023-10-01T10:00:00.000Z",
      "expiresAt": "2023-11-30T23:59:59.000Z",
      "isActive": false,
      "isExpired": true,
      "daysRemaining": null
    },
    {
      "id": "clmp555666777",
      "privilegeId": "clpr987654321",
      "privilegeName": "VIP Status",
      "privilegeDescription": "Permanent VIP status with lifetime benefits",
      "pointCost": 2000,
      "grantedAt": "2023-11-15T14:30:00.000Z",
      "expiresAt": null,
      "isActive": true,
      "isExpired": false,
      "daysRemaining": null
    }
  ],
  "message": "Member privileges retrieved successfully",
  "meta": {
    "timestamp": "2023-12-01T13:10:00.000Z",
    "traceId": "trace-mypriv123"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique member privilege identifier |
| `privilegeId` | string | Original privilege identifier |
| `privilegeName` | string | Name of the privilege |
| `privilegeDescription` | string | Description of the privilege |
| `pointCost` | number | Points that were deducted for this privilege |
| `grantedAt` | string | When the privilege was granted |
| `expiresAt` | string | When the privilege expires (null = permanent) |
| `isActive` | boolean | Whether the privilege is currently active |
| `isExpired` | boolean | Whether the privilege has expired |
| `daysRemaining` | number | Days until expiration (null if permanent or expired) |

#### Usage Example

```bash
curl -X GET "https://api.example.com/member/privileges/my-privileges" \
  -H "Authorization: Bearer YOUR_MEMBER_JWT_TOKEN"
```

---

### 4. Get Active Member Privileges

**GET** `/member/privileges/active`

Retrieve only the currently active (non-expired) privileges owned by the member.

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "id": "clmp123456789",
      "privilegeId": "clpr123456789",
      "privilegeName": "Premium Access",
      "privilegeDescription": "Access to premium features and exclusive content",
      "pointCost": 500,
      "grantedAt": "2023-12-01T13:05:00.000Z",
      "expiresAt": "2024-01-01T00:00:00.000Z",
      "isActive": true,
      "isExpired": false,
      "daysRemaining": 30
    },
    {
      "id": "clmp555666777",
      "privilegeId": "clpr987654321",
      "privilegeName": "VIP Status",
      "privilegeDescription": "Permanent VIP status with lifetime benefits",
      "pointCost": 2000,
      "grantedAt": "2023-11-15T14:30:00.000Z",
      "expiresAt": null,
      "isActive": true,
      "isExpired": false,
      "daysRemaining": null
    }
  ],
  "message": "Active member privileges retrieved successfully",
  "meta": {
    "timestamp": "2023-12-01T13:15:00.000Z",
    "traceId": "trace-active123"
  }
}
```

#### Usage Example

```bash
curl -X GET "https://api.example.com/member/privileges/active" \
  -H "Authorization: Bearer YOUR_MEMBER_JWT_TOKEN"
```

---

## Privilege Exchange Process

### 1. Check Available Privileges
Before exchanging, members should check what privileges are available and their costs.

### 2. Verify Point Balance
Ensure sufficient points are available for the desired privilege exchange.

### 3. Exchange Points
Submit exchange request with the privilege ID.

### 4. FIFO Point Deduction
Points are deducted from the oldest non-expired points first:
- System identifies required point amount
- Locates oldest available points
- Deducts points in chronological order
- Updates member's point balance

### 5. Privilege Activation
- Privilege is immediately granted to the member
- Expiration date is calculated (if applicable)
- Member can start using the privilege benefits

---

## Privilege States

### Available Privileges
- **Active**: Can be exchanged for points
- **Inactive**: Not available for new exchanges

### Member Privileges
- **Active & Not Expired**: Currently usable
- **Active & Expired**: No longer usable but still in records
- **Inactive**: Deactivated by admin (rare)

---

## Common Use Cases

### 1. Browse Available Privileges
```bash
# Get all available privileges
curl -X GET "https://api.example.com/member/privileges/available" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Exchange for Premium Access
```bash
# Check available privileges first
curl -X GET "https://api.example.com/member/privileges/available" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Exchange for specific privilege
curl -X POST "https://api.example.com/member/privileges/exchange" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"privilegeId": "clpr123456789"}'
```

### 3. Check Current Privileges
```bash
# Get all owned privileges
curl -X GET "https://api.example.com/member/privileges/my-privileges" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get only active privileges
curl -X GET "https://api.example.com/member/privileges/active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Error Handling

### Common Error Scenarios

1. **Insufficient Points**: Member doesn't have enough points
2. **Privilege Not Found**: Invalid or inactive privilege ID
3. **Already Owned**: Member already has an active instance of the privilege
4. **System Error**: Database or service unavailable

### Error Response Format

All errors follow the standard API error format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  },
  "meta": {
    "timestamp": "2023-12-01T13:00:00.000Z",
    "traceId": "trace-error123"
  }
}
```

---

## Best Practices

### For Members
1. **Check point balance** before attempting exchanges
2. **Review privilege details** including expiration dates
3. **Monitor active privileges** to track expiration dates
4. **Plan exchanges strategically** based on point earning patterns

### For Integration
1. **Handle insufficient points gracefully** with clear user messaging
2. **Display privilege expiration dates** prominently
3. **Implement retry logic** for transient errors
4. **Cache available privileges** with appropriate TTL
5. **Show point costs clearly** before exchange confirmation

---

## Integration Notes

- All endpoints require member authentication
- Point deduction is immediate and uses FIFO logic
- Privilege activation is immediate upon successful exchange
- Expired privileges remain in member records for audit purposes
- System prevents duplicate active privileges of the same type
- Privilege availability can change based on admin configuration