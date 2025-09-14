# Admin Privileges API Documentation

This document provides comprehensive documentation for the Admin Privileges API endpoints, including detailed request/response examples and usage scenarios.

## Overview

The Admin Privileges API allows administrators to manage privileges that members can exchange points for. This includes creating, updating, activating/deactivating, and deleting privileges.

**Base URL:** `/admin/privileges`  
**Authentication:** Bearer Token (Admin JWT)

## Endpoints

### 1. Create New Privilege

**POST** `/admin/privileges`

Create a new privilege that members can exchange points for. Privileges can have optional expiration periods.

#### Request Body

```json
{
  "name": "Premium Access",
  "description": "Access to premium features and exclusive content",
  "pointCost": 500,
  "validityDays": 30
}
```

#### Request Parameters

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `name` | string | Yes | Privilege name (3-100 characters) | `"Premium Access"` |
| `description` | string | Yes | Privilege description (max 500 characters) | `"Access to premium features"` |
| `pointCost` | number | Yes | Point cost (positive integer) | `500` |
| `validityDays` | number | No | Validity period in days (min 1) | `30` |

#### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": "clpr123456789",
    "name": "Premium Access",
    "description": "Access to premium features and exclusive content",
    "pointCost": 500,
    "isActive": true,
    "validityDays": 30,
    "createdAt": "2023-12-01T11:00:00.000Z",
    "updatedAt": "2023-12-01T11:00:00.000Z"
  },
  "message": "Privilege created successfully",
  "meta": {
    "timestamp": "2023-12-01T11:00:00.000Z",
    "traceId": "trace-priv123"
  }
}
```

#### Usage Examples

**Creating a temporary privilege:**
```bash
curl -X POST "https://api.example.com/admin/privileges" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Access",
    "description": "Access to premium features and exclusive content",
    "pointCost": 500,
    "validityDays": 30
  }'
```

**Creating a permanent privilege:**
```bash
curl -X POST "https://api.example.com/admin/privileges" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VIP Status",
    "description": "Permanent VIP status with lifetime benefits",
    "pointCost": 2000
  }'
```

---

### 2. Get All Privileges

**GET** `/admin/privileges`

Retrieve paginated list of privileges with optional filtering.

#### Query Parameters

| Parameter | Type | Required | Default | Description | Example |
|-----------|------|----------|---------|-------------|---------|
| `page` | number | No | 1 | Page number | `1` |
| `limit` | number | No | 10 | Items per page | `20` |
| `search` | string | No | - | Search term | `"premium"` |
| `isActive` | boolean | No | - | Filter by active status | `true` |
| `name` | string | No | - | Filter by exact name | `"Premium Access"` |

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
      "isActive": true,
      "validityDays": 30,
      "createdAt": "2023-12-01T11:00:00.000Z",
      "updatedAt": "2023-12-01T11:00:00.000Z"
    },
    {
      "id": "clpr987654321",
      "name": "VIP Status",
      "description": "Permanent VIP status with lifetime benefits",
      "pointCost": 2000,
      "isActive": true,
      "validityDays": null,
      "createdAt": "2023-11-30T10:00:00.000Z",
      "updatedAt": "2023-11-30T10:00:00.000Z"
    }
  ],
  "message": "Privileges retrieved successfully",
  "meta": {
    "timestamp": "2023-12-01T11:05:00.000Z",
    "traceId": "trace-list123",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Usage Examples

**Get all privileges:**
```bash
curl -X GET "https://api.example.com/admin/privileges" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Search for privileges:**
```bash
curl -X GET "https://api.example.com/admin/privileges?search=premium&isActive=true" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

### 3. Get Privilege by ID

**GET** `/admin/privileges/{id}`

Retrieve detailed information about a specific privilege.

#### Path Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `id` | string | Yes | Privilege unique identifier | `clpr123456789` |

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "clpr123456789",
    "name": "Premium Access",
    "description": "Access to premium features and exclusive content",
    "pointCost": 500,
    "isActive": true,
    "validityDays": 30,
    "createdAt": "2023-12-01T11:00:00.000Z",
    "updatedAt": "2023-12-01T11:00:00.000Z"
  },
  "message": "Privilege retrieved successfully",
  "meta": {
    "timestamp": "2023-12-01T11:10:00.000Z",
    "traceId": "trace-get123"
  }
}
```

#### Usage Example

```bash
curl -X GET "https://api.example.com/admin/privileges/clpr123456789" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

### 4. Update Privilege

**PUT** `/admin/privileges/{id}`

Update an existing privilege. All fields are optional - only provided fields will be updated.

#### Path Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `id` | string | Yes | Privilege unique identifier | `clpr123456789` |

#### Request Body

```json
{
  "name": "Premium Plus Access",
  "description": "Enhanced premium access with additional features",
  "pointCost": 750,
  "validityDays": 45,
  "isActive": true
}
```

#### Request Parameters

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `name` | string | No | Updated privilege name | `"Premium Plus Access"` |
| `description` | string | No | Updated description | `"Enhanced premium access"` |
| `pointCost` | number | No | Updated point cost | `750` |
| `validityDays` | number | No | Updated validity period | `45` |
| `isActive` | boolean | No | Active status | `true` |

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "clpr123456789",
    "name": "Premium Plus Access",
    "description": "Enhanced premium access with additional features",
    "pointCost": 750,
    "isActive": true,
    "validityDays": 45,
    "createdAt": "2023-12-01T11:00:00.000Z",
    "updatedAt": "2023-12-01T11:15:00.000Z"
  },
  "message": "Privilege updated successfully",
  "meta": {
    "timestamp": "2023-12-01T11:15:00.000Z",
    "traceId": "trace-update123"
  }
}
```

#### Usage Examples

**Update point cost only:**
```bash
curl -X PUT "https://api.example.com/admin/privileges/clpr123456789" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pointCost": 750}'
```

**Full update:**
```bash
curl -X PUT "https://api.example.com/admin/privileges/clpr123456789" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Plus Access",
    "description": "Enhanced premium access with additional features",
    "pointCost": 800,
    "validityDays": 45,
    "isActive": true
  }'
```

---

### 5. Activate Privilege

**PUT** `/admin/privileges/{id}/activate`

Activate a privilege, making it available for members to exchange points for.

#### Path Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `id` | string | Yes | Privilege unique identifier | `clpr123456789` |

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "clpr123456789",
    "name": "Premium Access",
    "description": "Access to premium features and exclusive content",
    "pointCost": 500,
    "isActive": true,
    "validityDays": 30,
    "createdAt": "2023-12-01T11:00:00.000Z",
    "updatedAt": "2023-12-01T11:20:00.000Z"
  },
  "message": "Privilege activated successfully",
  "meta": {
    "timestamp": "2023-12-01T11:20:00.000Z",
    "traceId": "trace-activate123"
  }
}
```

#### Usage Example

```bash
curl -X PUT "https://api.example.com/admin/privileges/clpr123456789/activate" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

### 6. Deactivate Privilege

**PUT** `/admin/privileges/{id}/deactivate`

Deactivate a privilege, preventing new exchanges while preserving existing member privileges.

#### Path Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `id` | string | Yes | Privilege unique identifier | `clpr123456789` |

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "clpr123456789",
    "name": "Premium Access",
    "description": "Access to premium features and exclusive content",
    "pointCost": 500,
    "isActive": false,
    "validityDays": 30,
    "createdAt": "2023-12-01T11:00:00.000Z",
    "updatedAt": "2023-12-01T11:25:00.000Z"
  },
  "message": "Privilege deactivated successfully",
  "meta": {
    "timestamp": "2023-12-01T11:25:00.000Z",
    "traceId": "trace-deactivate123"
  }
}
```

#### Usage Example

```bash
curl -X PUT "https://api.example.com/admin/privileges/clpr123456789/deactivate" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

### 7. Delete Privilege

**DELETE** `/admin/privileges/{id}`

Permanently delete a privilege. This action cannot be undone and will affect existing member privileges.

#### Path Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `id` | string | Yes | Privilege unique identifier | `clpr123456789` |

#### Success Response (204 No Content)

No response body is returned for successful deletion.

#### Usage Example

```bash
curl -X DELETE "https://api.example.com/admin/privileges/clpr123456789" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

## Common Error Responses

### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "pointCost": ["pointCost must be a positive number"]
    }
  },
  "meta": {
    "timestamp": "2023-12-01T11:00:00.000Z",
    "traceId": "trace-error123"
  }
}
```

### 404 Not Found - Privilege Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Privilege not found",
    "details": {
      "privilegeId": "clpr123456789"
    }
  },
  "meta": {
    "timestamp": "2023-12-01T11:00:00.000Z",
    "traceId": "trace-error123"
  }
}
```

### 409 Conflict - Duplicate Privilege
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_RESOURCE",
    "message": "Privilege with this name already exists",
    "details": {
      "name": "Premium Access"
    }
  },
  "meta": {
    "timestamp": "2023-12-01T11:00:00.000Z",
    "traceId": "trace-error123"
  }
}
```

---

## Best Practices

1. **Use descriptive names** for privileges that clearly indicate their purpose
2. **Set appropriate point costs** based on the value of the privilege
3. **Consider validity periods** carefully - permanent privileges should be rare
4. **Deactivate instead of delete** when you want to stop new exchanges but preserve existing privileges
5. **Use search and filtering** to manage large numbers of privileges efficiently
6. **Monitor privilege usage** to adjust costs and availability as needed

---

## Privilege Lifecycle

1. **Creation**: Admin creates a new privilege with name, description, and cost
2. **Activation**: Privilege becomes available for member exchange (default: active)
3. **Exchange**: Members can exchange points for the privilege
4. **Updates**: Admin can modify privilege details, costs, and validity
5. **Deactivation**: Privilege becomes unavailable for new exchanges
6. **Deletion**: Permanent removal (use with caution)

---

## Integration Notes

- Privileges are automatically available to members once created and activated
- Point costs are deducted using FIFO logic when members exchange
- Validity periods start from the exchange date, not creation date
- Deactivated privileges remain visible to admins but not to members
- Deleted privileges may affect existing member privilege records