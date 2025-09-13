# Standardized API Response System

This module provides a comprehensive standardized API response system for the NestJS application, including response formatting, error handling, request tracing, and logging.

## Features

- **Standardized Response Format**: Consistent success and error response structures
- **Request Tracing**: Unique trace ID generation and propagation
- **Global Error Handling**: Centralized exception handling with proper categorization
- **Request/Response Logging**: Comprehensive logging with structured data
- **Domain Exceptions**: Custom business logic exceptions
- **Response Utilities**: Helper functions for creating formatted responses

## Components

### Response Interfaces

```typescript
// Success Response
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta: {
    timestamp: string;
    traceId: string;
    pagination?: PaginationMeta;
  };
}

// Error Response
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    traceId: string;
  };
}
```

### Interceptors

#### ResponseInterceptor
Automatically formats all API responses to follow the standardized format:
- Generates or extracts trace IDs
- Adds timestamps
- Handles pagination metadata
- Sets trace ID headers

#### LoggingInterceptor
Logs all incoming requests and outgoing responses:
- Request details with trace ID
- Response time measurement
- Error logging with stack traces

### Exception Filter

#### GlobalExceptionFilter
Handles all exceptions and formats them consistently:
- Domain exceptions with proper HTTP status mapping
- NestJS HTTP exceptions
- Generic errors with sanitized messages
- Comprehensive error logging

### Domain Exceptions

Custom exceptions for business logic:

```typescript
// Validation errors
throw new ValidationException('Email is required', { field: 'email' });

// Not found errors
throw new NotFoundExceptionDomain('User', '123');

// Authorization errors
throw new UnauthorizedException('Invalid token');
throw new ForbiddenException('Insufficient permissions');

// Business rule violations
throw new BusinessRuleException('Insufficient points for exchange');

// Conflicts
throw new ConflictException('Email already exists');
```

### Response Utilities

Helper functions for creating formatted responses:

```typescript
import { ResponseUtil } from './utils/response.util';

// Simple success response
return ResponseUtil.success(data, 'Operation successful');

// Paginated response
const pagination = ResponseUtil.createPaginationMeta(page, limit, total);
return ResponseUtil.successWithPagination(items, pagination, 'Items retrieved');
```

## Usage Examples

### Controller Implementation

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { ValidationException, NotFoundExceptionDomain } from '../common/exceptions/domain.exception';

@Controller('users')
export class UsersController {
  @Get()
  async getUsers(@Query('page') page = 1, @Query('limit') limit = 10) {
    const users = await this.userService.findMany(page, limit);
    const total = await this.userService.count();
    
    const pagination = ResponseUtil.createPaginationMeta(page, limit, total);
    return ResponseUtil.successWithPagination(users, pagination, 'Users retrieved successfully');
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundExceptionDomain('User', id);
    }
    
    return ResponseUtil.success(user, 'User retrieved successfully');
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    // Validation will be handled by ValidationPipe
    // Domain exceptions will be caught by GlobalExceptionFilter
    
    const user = await this.userService.create(createUserDto);
    return ResponseUtil.success(user, 'User created successfully');
  }
}
```

### Service Implementation with Domain Exceptions

```typescript
import { Injectable } from '@nestjs/common';
import { ValidationException, ConflictException } from '../common/exceptions/domain.exception';

@Injectable()
export class UserService {
  async create(userData: CreateUserDto) {
    // Check for existing user
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate business rules
    if (userData.age < 18) {
      throw new ValidationException('User must be at least 18 years old', {
        field: 'age',
        minValue: 18,
        actualValue: userData.age
      });
    }

    return await this.userRepository.create(userData);
  }
}
```

## Response Examples

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "message": "User retrieved successfully",
  "meta": {
    "timestamp": "2023-12-01T10:30:00.000Z",
    "traceId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [
    { "id": "1", "name": "User 1" },
    { "id": "2", "name": "User 2" }
  ],
  "message": "Users retrieved successfully",
  "meta": {
    "timestamp": "2023-12-01T10:30:00.000Z",
    "traceId": "550e8400-e29b-41d4-a716-446655440000",
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

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": {
      "field": "email",
      "code": "REQUIRED"
    }
  },
  "meta": {
    "timestamp": "2023-12-01T10:30:00.000Z",
    "traceId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## Trace ID Propagation

The system automatically handles trace ID propagation:

1. **Client sends request** with optional `x-trace-id` header
2. **System generates** trace ID if not provided
3. **Trace ID is stored** in request context
4. **All logs include** the trace ID
5. **Response includes** trace ID in header and body

## Testing

The module includes comprehensive tests:

```bash
# Run all common module tests
npm test -- --testPathPatterns="src/common"

# Run specific test suites
npm test -- --testPathPatterns="response.interceptor.spec.ts"
npm test -- --testPathPatterns="global-exception.filter.spec.ts"
```

## Integration

The system is automatically integrated through the `CommonModule`:

```typescript
// app.module.ts
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    CommonModule, // Automatically registers interceptors and filters
    // ... other modules
  ],
})
export class AppModule {}
```

## Best Practices

1. **Use Domain Exceptions**: Always throw domain-specific exceptions instead of generic errors
2. **Include Context**: Provide meaningful error messages and details
3. **Leverage Response Utils**: Use helper functions for consistent response formatting
4. **Handle Pagination**: Use the pagination utilities for list endpoints
5. **Log Appropriately**: The system handles logging automatically, but add business-specific logs as needed

## Requirements Satisfied

This implementation satisfies the following requirements:

- **6.1**: Standardized success response format with data and metadata
- **6.2**: Standardized error response format with error codes and messages
- **6.3**: Detailed field-level validation error information
- **6.5**: Appropriate HTTP status codes for all responses
- **7.1**: Comprehensive request logging with unique trace IDs