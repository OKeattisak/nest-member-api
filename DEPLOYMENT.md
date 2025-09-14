# Member Service System - Deployment Guide

This guide covers the deployment and configuration of the Member Service System using Docker and Docker Compose.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Development Deployment](#development-deployment)
- [Production Deployment](#production-deployment)
- [Health Checks](#health-checks)
- [Database Management](#database-management)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Node.js**: Version 18 or higher (for local development)
- **PostgreSQL Client**: For database management (optional)

### System Requirements

#### Development Environment
- **RAM**: Minimum 4GB, Recommended 8GB
- **Storage**: Minimum 10GB free space
- **CPU**: 2+ cores recommended

#### Production Environment
- **RAM**: Minimum 8GB, Recommended 16GB
- **Storage**: Minimum 50GB free space
- **CPU**: 4+ cores recommended
- **Network**: Stable internet connection

## Environment Configuration

### Environment Variables

The application uses environment-specific configuration files:

- `.env.development` - Development settings
- `.env.production` - Production settings
- `.env.test` - Testing settings

#### Required Environment Variables for Production

```bash
# Security (REQUIRED)
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
ADMIN_JWT_SECRET="your-super-secret-admin-jwt-key-at-least-32-characters-long"
POSTGRES_PASSWORD="your-secure-database-password"

# Optional Configuration
POSTGRES_DB="member_service_prod"
POSTGRES_USER="postgres"
CORS_ORIGINS="https://yourdomain.com,https://admin.yourdomain.com"
LOG_LEVEL="info"
RATE_LIMIT_LIMIT="100"
BCRYPT_ROUNDS="12"
```

### Configuration Files

The application supports multiple configuration modules:

- **App Config**: General application settings
- **Database Config**: Database connection and pooling
- **Auth Config**: Authentication and security settings
- **Logging Config**: Logging levels and output
- **Business Config**: Business logic parameters

## Development Deployment

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd member-service-system
   ```

2. **Copy environment file**
   ```bash
   cp .env.example .env
   ```

3. **Start development services**
   ```bash
   # Using Docker Compose
   docker-compose --profile dev up -d
   
   # Or using the deployment script (Linux/Mac)
   ./scripts/deploy.sh development
   
   # Or using the deployment script (Windows)
   scripts\deploy.bat development
   ```

4. **Run database migrations**
   ```bash
   docker-compose exec app-dev npx prisma migrate dev
   ```

5. **Access the application**
   - API: http://localhost:3000/api
   - Documentation: http://localhost:3000/api/docs
   - Health Check: http://localhost:3000/api/health

### Development Services

The development environment includes:

- **Application**: NestJS application with hot reloading
- **PostgreSQL**: Database server
- **Redis**: Caching and session management
- **Logs**: Mounted volume for log persistence

## Production Deployment

### Prerequisites

1. **Set required environment variables**
   ```bash
   export JWT_SECRET="your-production-jwt-secret-at-least-32-characters"
   export ADMIN_JWT_SECRET="your-production-admin-jwt-secret-at-least-32-characters"
   export POSTGRES_PASSWORD="your-secure-database-password"
   ```

2. **Configure production settings**
   - Update `.env.production` with your specific settings
   - Configure CORS origins for your domain
   - Set appropriate rate limits and security settings

### Deployment Steps

1. **Deploy using script (Recommended)**
   ```bash
   # Linux/Mac
   ./scripts/deploy.sh production
   
   # Windows
   scripts\deploy.bat production
   ```

2. **Manual deployment**
   ```bash
   # Build and start production services
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile prod build --no-cache
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile prod up -d
   
   # Run database migrations
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec app npx prisma migrate deploy
   ```

### Production Services

The production environment includes:

- **Application**: Optimized NestJS application
- **PostgreSQL**: Database with production settings
- **Redis**: Caching layer
- **Health Checks**: Automated health monitoring
- **Log Management**: Structured logging with rotation

## Health Checks

The application provides comprehensive health check endpoints:

### Endpoints

- **Liveness**: `GET /api/health/live` - Basic application status
- **Readiness**: `GET /api/health/ready` - Service readiness (database connectivity)
- **Health**: `GET /api/health` - Comprehensive health check
- **System Info**: `GET /api/health/info` - Detailed system information

### Docker Health Checks

Docker containers include built-in health checks:

```yaml
healthcheck:
  test: ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3000/api/health/live', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })\""]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Monitoring Integration

Health check endpoints can be integrated with:

- **Kubernetes**: Liveness and readiness probes
- **Docker Swarm**: Health check configuration
- **Load Balancers**: Health check targets
- **Monitoring Tools**: Prometheus, Grafana, etc.

## Database Management

### Connection Pooling

The application uses optimized database connection pooling:

```typescript
// Production settings
maxConnections: 20
connectionTimeout: 20000ms
idleTimeout: 30000ms
maxLifetime: 30 minutes
```

### Backup and Restore

#### Create Backup
```bash
# Linux/Mac
./scripts/backup.sh

# Manual backup
docker exec member-service-postgres pg_dump -U postgres -d member_service_db > backup.sql
```

#### Restore Backup
```bash
# Linux/Mac
./scripts/restore.sh

# Manual restore
docker exec -i member-service-postgres psql -U postgres -d member_service_db < backup.sql
```

### Migrations

```bash
# Development
docker-compose exec app-dev npx prisma migrate dev

# Production
docker-compose exec app npx prisma migrate deploy

# Generate Prisma client
docker-compose exec app npx prisma generate
```

## Monitoring and Logging

### Log Configuration

The application supports multiple logging outputs:

- **Console**: Development debugging
- **File**: Persistent log storage
- **Structured**: JSON format for log aggregation

### Log Levels

- **Error**: System errors and exceptions
- **Warn**: Business rule violations, deprecated usage
- **Info**: Important business events, API requests
- **Debug**: Detailed execution flow

### Performance Monitoring

Built-in performance monitoring includes:

- **Request Duration**: API endpoint response times
- **Database Queries**: Query execution time and slow query detection
- **Memory Usage**: Heap and RSS memory monitoring
- **Background Jobs**: Job execution time and success rates

### Log Rotation

Production logs are automatically rotated:

- **Max File Size**: 50MB
- **Retention**: 30 days
- **Compression**: Automatic gzip compression

## Troubleshooting

### Common Issues

#### 1. Container Won't Start

**Symptoms**: Container exits immediately or fails to start

**Solutions**:
```bash
# Check container logs
docker-compose logs app

# Check system resources
docker system df
docker system prune

# Rebuild containers
docker-compose build --no-cache
```

#### 2. Database Connection Issues

**Symptoms**: Application can't connect to database

**Solutions**:
```bash
# Check database container status
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres psql -U postgres -d member_service_db -c "SELECT 1;"
```

#### 3. Health Check Failures

**Symptoms**: Health check endpoints return errors

**Solutions**:
```bash
# Check application logs
docker-compose logs app

# Test health endpoint manually
curl -v http://localhost:3000/api/health/live

# Check system resources
docker stats
```

#### 4. Performance Issues

**Symptoms**: Slow response times or high resource usage

**Solutions**:
```bash
# Monitor resource usage
docker stats

# Check slow queries
docker-compose logs app | grep "Slow query"

# Analyze database performance
docker-compose exec postgres psql -U postgres -d member_service_db -c "SELECT * FROM pg_stat_activity;"
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Set environment variable
export LOG_LEVEL=debug
export ENABLE_DB_LOGGING=true

# Restart services
docker-compose restart
```

### Support

For additional support:

1. Check application logs: `docker-compose logs app`
2. Review health check status: `curl http://localhost:3000/api/health`
3. Monitor system resources: `docker stats`
4. Check database connectivity: `docker-compose exec postgres pg_isready`

## Security Considerations

### Production Security Checklist

- [ ] Strong JWT secrets (32+ characters)
- [ ] Secure database passwords
- [ ] CORS configured for specific domains
- [ ] Rate limiting enabled
- [ ] HTTPS enabled (reverse proxy)
- [ ] Security headers configured
- [ ] Log sensitive data filtering
- [ ] Regular security updates

### Network Security

- Use Docker networks for service isolation
- Configure firewall rules for exposed ports
- Use reverse proxy (nginx, traefik) for HTTPS termination
- Implement proper authentication and authorization

### Data Security

- Enable database encryption at rest
- Use secure backup storage
- Implement proper access controls
- Regular security audits and updates