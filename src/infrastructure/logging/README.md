# Logging and Observability Infrastructure

This module provides comprehensive logging and observability infrastructure for the Member Service System using Winston logger with structured logging, request tracing, and performance monitoring.

## Features

### 1. Structured Logging with Winston
- JSON-formatted logs with consistent structure
- Multiple log levels: error, warn, info, debug, verbose
- Daily log rotation with compression
- Separate log files for different log levels
- Console output for development with colorized formatting

### 2. Request/Response Logging
- Automatic logging of all HTTP requests and responses
- Unique trace ID generation and propagation
- Request duration tracking
- Error response logging with stack traces

### 3. Database Query Logging
- Prisma query execution logging
- Query performance monitoring
- Slow query detection and alerting
- Database operation error tracking

### 4. Performance Monitoring
- API endpoint response time tracking
- Memory usage monitoring for slow requests
- Configurable thresholds for performance alerts
- Background job execution monitoring

### 5. Business Event Logging
- Authentication attempt logging
- Point transaction logging
- Privilege exchange logging
- System startup and component initialization logging

## Configuration

### Environment Variables

```bash
# Logging Configuration
LOG_LEVEL=info                    # Log level (error, warn, info, debug, verbose)
ENABLE_DB_LOGGING=true           # Enable database query logging
ENABLE_PERFORMANCE_LOGGING=true  # Enable performance monitoring
SLOW_QUERY_THRESHOLD=1000        # Slow query threshold in milliseconds
SLOW_REQUEST_THRESHOLD=2000      # Slow request threshold in milliseconds
```

### Log Files

Logs are stored in the `logs/` directory with daily rotation:

- `logs/application-YYYY-MM-DD.log` - General application logs (info level and above)
- `logs/error-YYYY-MM-DD.log` - Error logs only
- `logs/debug-YYYY-MM-DD.log` - Debug logs (all levels)
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

## Usage

### Basic Logging

```typescript
import { LoggerService } from '../infrastructure/logging/logger.service';

@Injectable()
export class MyService {
  constructor(private readonly logger: LoggerService) {}

  someMethod() {
    this.logger.log('Operation completed', 'MyService');
    this.logger.warn('Warning message', 'MyService');
    this.logger.error('Error occurred', error.stack, 'MyService');
    this.logger.debug('Debug information', 'MyService');
  }
}
```

### Business Event Logging

```typescript
// Authentication logging
this.logger.logAuthenticationAttempt('user@example.com', true, '127.0.0.1');

// Point transaction logging
this.logger.logPointTransaction('member-123', 100, 'EARNED', 'Welcome bonus');

// Privilege exchange logging
this.logger.logPrivilegeExchange('member-123', 'privilege-456', 50);

// Database query logging (automatic via Prisma middleware)
// API performance logging (automatic via interceptor)

// Background job logging
this.logger.logBackgroundJob('point-expiration', 'completed', 1500);

// System startup logging
this.logger.logSystemStartup('DatabaseService', 2000);
```

### Custom Log Context

```typescript
this.logger.log('Custom operation', 'MyService', {
  operation: 'custom_operation',
  userId: 'user-123',
  duration: 500,
  metadata: {
    customField: 'value',
    requestId: 'req-456',
  },
});
```

## Log Structure

All logs follow a consistent JSON structure:

```json
{
  "timestamp": "2025-09-13 20:48:03",
  "level": "info",
  "message": "Authentication attempt",
  "context": "AuthService",
  "traceId": "e6d09dce-bcc9-4bc7-9540-fec8f46df5f8",
  "operation": "authentication",
  "userId": "member-123",
  "duration": 150,
  "metadata": {
    "email": "user@example.com",
    "success": true,
    "ip": "127.0.0.1"
  },
  "service": "member-service-system",
  "environment": "development"
}
```

## Interceptors

### LoggingInterceptor
- Logs all incoming HTTP requests
- Logs outgoing HTTP responses with duration
- Logs HTTP errors with stack traces
- Includes trace ID for request correlation

### PerformanceInterceptor
- Monitors API endpoint response times
- Logs slow requests with memory usage information
- Configurable performance thresholds
- Can be disabled via environment configuration

## Prisma Integration

Database query logging is automatically enabled through Prisma middleware:

- Query execution time tracking
- Slow query detection
- Database error logging
- Query parameter logging (truncated for security)

## Trace ID Propagation

Each request gets a unique trace ID that is:
- Generated automatically for new requests
- Propagated through all service calls
- Included in all log entries
- Returned in API responses for debugging

## Testing

The logging infrastructure includes comprehensive tests:

```bash
# Run logging service tests
npm test -- --testPathPatterns="logger.service.spec.ts"

# Run performance interceptor tests
npm test -- --testPathPatterns="performance.interceptor.spec.ts"

# Run integration tests
npm test -- --testPathPatterns="logging-integration.spec.ts"
```

## Production Considerations

### Log Retention
- Log files are rotated daily
- Compressed archives are kept for 14 days
- Maximum file size is 20MB before rotation

### Performance Impact
- Database logging can be disabled in production if needed
- Performance monitoring has minimal overhead
- Log levels can be adjusted per environment

### Security
- Sensitive data is not logged (passwords, tokens)
- Query parameters are truncated to prevent data leakage
- Error messages are sanitized for external responses

## Monitoring and Alerting

The logging infrastructure provides structured data for:
- Application performance monitoring (APM)
- Error tracking and alerting
- Business metrics collection
- System health monitoring
- Audit trail maintenance

## Integration with External Systems

Logs can be easily integrated with:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- DataDog
- New Relic
- CloudWatch (AWS)
- Azure Monitor

The JSON format ensures compatibility with most log aggregation systems.