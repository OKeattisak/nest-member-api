# API Documentation

This directory contains comprehensive API documentation for the Member Service System.

## Available Documentation

### Admin APIs
- **[Admin Points API Documentation](admin-points.md)** - Complete documentation with request/response examples
- **[Admin Privileges API Documentation](admin-privileges.md)** - Privilege management with CRUD operations
- **[Admin Jobs API Documentation](admin-jobs.md)** - Background job management and monitoring

### Member APIs
- **[Member Privileges API Documentation](member-privileges.md)** - Privilege exchange and management for members

### Postman Collections
- **[Admin Points Collection](postman/admin-points-collection.json)** - Ready-to-use Postman collection for testing
- **[Admin Privileges Collection](postman/admin-privileges-collection.json)** - Privilege management testing
- **[Admin Jobs Collection](postman/admin-jobs-collection.json)** - Job management and monitoring testing
- **[Member Privileges Collection](postman/member-privileges-collection.json)** - Member privilege testing

## Quick Start

### 1. Using the Documentation
The markdown documentation files provide:
- Detailed endpoint descriptions
- Request/response examples
- Error handling scenarios
- Authentication requirements
- Best practices

### 2. Using Postman Collections
1. Import the collection file into Postman
2. Set up environment variables:
   - `base_url`: Your API base URL (e.g., `http://localhost:3000`)
   - `admin_token`: Will be automatically set after login
   - `member_id`: Test member ID for operations
3. Run the "Admin Login" request first to authenticate
4. Use other requests to test the API endpoints

### 3. Interactive API Documentation
The system also provides interactive Swagger documentation at:
```
http://localhost:3000/api/docs
```

## Authentication

All admin endpoints require JWT authentication. Get your token by:

1. **Using the login endpoint:**
   ```bash
   POST /admin/auth/login
   {
     "emailOrUsername": "admin@example.com",
     "password": "AdminPassword123!"
   }
   ```

2. **Include the token in requests:**
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```

## API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful",
  "meta": {
    "timestamp": "2023-12-01T10:00:00.000Z",
    "traceId": "trace-id-123",
    "pagination": { /* pagination info if applicable */ }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { /* additional error details */ }
  },
  "meta": {
    "timestamp": "2023-12-01T10:00:00.000Z",
    "traceId": "trace-id-123"
  }
}
```

## Available Endpoints

### Admin Points Management
- `POST /admin/points/add` - Add points to member account
- `POST /admin/points/deduct` - Deduct points from member account
- `GET /admin/points/balance/{memberId}` - Get member point balance
- `GET /admin/points/history/{memberId}` - Get member point transaction history
- `GET /admin/points/expiring` - Get points expiring soon

### Admin Privileges Management
- `POST /admin/privileges` - Create new privilege
- `GET /admin/privileges` - Get all privileges with filtering
- `GET /admin/privileges/{id}` - Get privilege by ID
- `PUT /admin/privileges/{id}` - Update privilege
- `PUT /admin/privileges/{id}/activate` - Activate privilege
- `PUT /admin/privileges/{id}/deactivate` - Deactivate privilege
- `DELETE /admin/privileges/{id}` - Delete privilege

### Admin Jobs Management
- `POST /admin/jobs/point-expiration/trigger` - Trigger point expiration job
- `POST /admin/jobs/point-expiration/trigger-with-retry` - Trigger with retry logic
- `GET /admin/jobs/point-expiration/status` - Get job status
- `GET /admin/jobs/point-expiration/monitoring` - Get job monitoring data
- `GET /admin/jobs/point-expiration/executions` - Get recent executions
- `POST /admin/jobs/point-expiration/check-expiring` - Check expiring points
- `GET /admin/jobs/monitoring` - Get all jobs monitoring data

### Member Privileges Management
- `GET /member/privileges/available` - Get available privileges for exchange
- `POST /member/privileges/exchange` - Exchange points for privilege
- `GET /member/privileges/my-privileges` - Get all member privileges
- `GET /member/privileges/active` - Get active member privileges

## Testing

### Using curl
```bash
# Login to get token
curl -X POST "http://localhost:3000/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername": "admin@example.com", "password": "AdminPassword123!"}'

# Use the token for authenticated requests
curl -X GET "http://localhost:3000/admin/points/balance/clm123456789" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman
1. Import the collection from `postman/admin-points-collection.json`
2. Set up your environment variables
3. Run the authentication request first
4. Test other endpoints

## Error Codes

Common error codes you might encounter:

- `UNAUTHORIZED` (401) - Missing or invalid authentication token
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found (e.g., member doesn't exist)
- `VALIDATION_ERROR` (400) - Invalid request data
- `INSUFFICIENT_POINTS` (400) - Not enough points for deduction
- `INTERNAL_ERROR` (500) - Server error

## Support

For questions or issues with the API:
1. Check the detailed documentation in this directory
2. Review the Swagger documentation at `/api/docs`
3. Test with the provided Postman collections
4. Check the application logs for detailed error information