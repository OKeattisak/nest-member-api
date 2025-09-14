# Admin Jobs API Documentation

This document provides comprehensive documentation for the Admin Jobs API endpoints, including detailed request/response examples and usage scenarios.

## Overview

The Admin Jobs API allows administrators to manage and monitor background jobs in the system, particularly the point expiration job that processes expired points using FIFO logic.

**Base URL:** `/admin/jobs`  
**Authentication:** Bearer Token (Admin JWT)

## Endpoints

### 1. Trigger Point Expiration Job

**POST** `/admin/jobs/point-expiration/trigger`

Manually trigger the point expiration job to process expired points immediately.

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "executionId": "exec-123456789",
    "status": "completed",
    "startTime": "2023-12-01T12:00:00.000Z",
    "endTime": "2023-12-01T12:00:05.000Z",
    "duration": 5000,
    "processedCount": 150,
    "errorCount": 0,
    "result": {
      "expiredPointsCount": 150,
      "totalPointsExpired": 7500,
      "affectedMembersCount": 45
    }
  },
  "message": "Point expiration job completed successfully",
  "meta": {
    "timestamp": "2023-12-01T12:00:05.000Z",
    "traceId": "job-exec-123456789"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `executionId` | string | Unique identifier for this job execution |
| `status` | string | Job status: `completed`, `failed`, or `running` |
| `startTime` | string | Job start timestamp |
| `endTime` | string | Job completion timestamp |
| `duration` | number | Execution duration in milliseconds |
| `processedCount` | number | Number of point records processed |
| `errorCount` | number | Number of errors encountered |
| `result.expiredPointsCount` | number | Number of points that were expired |
| `result.totalPointsExpired` | number | Total point value that expired |
| `result.affectedMembersCount` | number | Number of members affected |

#### Usage Example

```bash
curl -X POST "https://api.example.com/admin/jobs/point-expiration/trigger" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

### 2. Trigger Point Expiration Job with Retry

**POST** `/admin/jobs/point-expiration/trigger-with-retry`

Manually trigger the point expiration job with automatic retry logic in case of failures.

#### Query Parameters

| Parameter | Type | Required | Default | Description | Example |
|-----------|------|----------|---------|-------------|---------|
| `maxRetries` | number | No | 3 | Maximum retry attempts | `5` |

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "executionId": "exec-retry-123456789",
    "status": "completed",
    "startTime": "2023-12-01T12:05:00.000Z",
    "endTime": "2023-12-01T12:05:08.000Z",
    "duration": 8000,
    "retryCount": 1,
    "maxRetries": 3,
    "processedCount": 150,
    "errorCount": 0
  },
  "message": "Point expiration job completed successfully after 1 retries",
  "meta": {
    "timestamp": "2023-12-01T12:05:08.000Z",
    "traceId": "job-exec-retry-123456789"
  }
}
```

#### Usage Examples

**Default retry (3 attempts):**
```bash
curl -X POST "https://api.example.com/admin/jobs/point-expiration/trigger-with-retry" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Custom retry attempts:**
```bash
curl -X POST "https://api.example.com/admin/jobs/point-expiration/trigger-with-retry?maxRetries=5" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

### 3. Get Point Expiration Job Status

**GET** `/admin/jobs/point-expiration/status`

Get the current status of the point expiration job.

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "isProcessing": false,
    "lastRun": "2023-12-01T12:00:00.000Z"
  },
  "message": "Point expiration job status retrieved successfully",
  "meta": {
    "timestamp": "2023-12-01T12:10:00.000Z",
    "traceId": "status-1701432600000"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `isProcessing` | boolean | Whether the job is currently running |
| `lastRun` | string | Timestamp of last job execution (null if never run) |

#### Usage Example

```bash
curl -X GET "https://api.example.com/admin/jobs/point-expiration/status" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

### 4. Get Point Expiration Job Monitoring Data

**GET** `/admin/jobs/point-expiration/monitoring`

Retrieve comprehensive monitoring data for the point expiration job.

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "jobName": "point-expiration",
    "totalExecutions": 45,
    "successfulExecutions": 43,
    "failedExecutions": 2,
    "averageDuration": 4500,
    "lastExecution": {
      "executionId": "exec-123456789",
      "status": "completed",
      "startTime": "2023-12-01T12:00:00.000Z",
      "duration": 5000,
      "processedCount": 150
    }
  },
  "message": "Point expiration job monitoring data retrieved successfully",
  "meta": {
    "timestamp": "2023-12-01T12:15:00.000Z",
    "traceId": "monitoring-1701433200000"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `jobName` | string | Name of the job |
| `totalExecutions` | number | Total number of job executions |
| `successfulExecutions` | number | Number of successful executions |
| `failedExecutions` | number | Number of failed executions |
| `averageDuration` | number | Average execution duration in milliseconds |
| `lastExecution` | object | Details of the most recent execution |

#### Usage Example

```bash
curl -X GET "https://api.example.com/admin/jobs/point-expiration/monitoring" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

### 5. Get Recent Job Executions

**GET** `/admin/jobs/point-expiration/executions`

Retrieve a list of recent point expiration job executions.

#### Query Parameters

| Parameter | Type | Required | Default | Description | Example |
|-----------|------|----------|---------|-------------|---------|
| `limit` | number | No | 10 | Maximum executions to return | `20` |

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "executionId": "exec-123456789",
      "status": "completed",
      "startTime": "2023-12-01T12:00:00.000Z",
      "endTime": "2023-12-01T12:00:05.000Z",
      "duration": 5000,
      "processedCount": 150,
      "errorCount": 0,
      "retryCount": 0
    },
    {
      "executionId": "exec-987654321",
      "status": "completed",
      "startTime": "2023-12-01T06:00:00.000Z",
      "endTime": "2023-12-01T06:00:03.000Z",
      "duration": 3000,
      "processedCount": 89,
      "errorCount": 0,
      "retryCount": 0
    }
  ],
  "message": "Recent job executions retrieved successfully",
  "meta": {
    "timestamp": "2023-12-01T12:20:00.000Z",
    "traceId": "executions-1701433500000"
  }
}
```

#### Usage Examples

**Default limit (10 executions):**
```bash
curl -X GET "https://api.example.com/admin/jobs/point-expiration/executions" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Custom limit:**
```bash
curl -X GET "https://api.example.com/admin/jobs/point-expiration/executions?limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

### 6. Check for Expiring Points

**POST** `/admin/jobs/point-expiration/check-expiring`

Perform a check for points that will expire within the specified number of days.

#### Query Parameters

| Parameter | Type | Required | Default | Description | Example |
|-----------|------|----------|---------|-------------|---------|
| `days` | number | No | 7 | Days to look ahead | `14` |

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Checked for points expiring within 7 days",
    "daysChecked": 7
  },
  "message": "Expiring points check completed successfully",
  "meta": {
    "timestamp": "2023-12-01T12:25:00.000Z",
    "traceId": "expiring-check-1701433800000"
  }
}
```

#### Usage Examples

**Default check (7 days):**
```bash
curl -X POST "https://api.example.com/admin/jobs/point-expiration/check-expiring" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Custom days:**
```bash
curl -X POST "https://api.example.com/admin/jobs/point-expiration/check-expiring?days=14" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

### 7. Get All Jobs Monitoring Data

**GET** `/admin/jobs/monitoring`

Retrieve comprehensive monitoring data for all background jobs in the system.

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "point-expiration": {
      "jobName": "point-expiration",
      "totalExecutions": 45,
      "successfulExecutions": 43,
      "failedExecutions": 2,
      "averageDuration": 4500
    }
  },
  "message": "All jobs monitoring data retrieved successfully",
  "meta": {
    "timestamp": "2023-12-01T12:30:00.000Z",
    "traceId": "all-monitoring-1701434100000"
  }
}
```

#### Usage Example

```bash
curl -X GET "https://api.example.com/admin/jobs/monitoring" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

---

## Job Execution States

### Status Values

| Status | Description |
|--------|-------------|
| `running` | Job is currently executing |
| `completed` | Job completed successfully |
| `failed` | Job failed with errors |

### Typical Job Flow

1. **Trigger**: Admin manually triggers job or scheduled execution starts
2. **Running**: Job processes expired points using FIFO logic
3. **Processing**: Points are marked as expired and member balances updated
4. **Completion**: Job finishes with success/failure status and metrics
5. **Monitoring**: Results are available via monitoring endpoints

---

## Error Handling

### Job Execution Failures

When a job fails, the response includes error details:

```json
{
  "success": true,
  "data": {
    "executionId": "exec-failed-123",
    "status": "failed",
    "startTime": "2023-12-01T12:00:00.000Z",
    "endTime": "2023-12-01T12:00:02.000Z",
    "duration": 2000,
    "processedCount": 0,
    "errorCount": 1,
    "error": {
      "message": "Database connection timeout",
      "code": "DB_TIMEOUT"
    }
  },
  "message": "Point expiration job failed",
  "meta": {
    "timestamp": "2023-12-01T12:00:02.000Z",
    "traceId": "job-exec-failed-123"
  }
}
```

### Retry Logic

The retry mechanism automatically attempts to re-execute failed jobs:

- **Exponential backoff**: Delays increase between retry attempts
- **Maximum retries**: Configurable limit on retry attempts
- **Failure threshold**: Job marked as failed after max retries exceeded

---

## Best Practices

1. **Monitor job status** regularly to ensure point expiration is working correctly
2. **Use retry logic** for critical operations to handle transient failures
3. **Check expiring points** periodically to notify members before expiration
4. **Review execution history** to identify patterns or recurring issues
5. **Set appropriate limits** when querying execution history to avoid performance issues
6. **Schedule regular checks** during low-traffic periods for better performance

---

## Performance Considerations

- **Batch processing**: Jobs process points in batches for better performance
- **Database optimization**: Proper indexing on expiration dates improves query performance
- **Monitoring overhead**: Frequent monitoring calls may impact system performance
- **Concurrent execution**: Only one instance of the same job runs at a time
- **Resource usage**: Large point expiration jobs may temporarily increase CPU and memory usage

---

## Integration Notes

- Jobs can be triggered manually or run on a schedule
- Job results are persisted for monitoring and audit purposes
- Failed jobs should be investigated and potentially re-run
- Monitoring data helps identify system health and performance trends
- Point expiration affects member balances and should be communicated to users