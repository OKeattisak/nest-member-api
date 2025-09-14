@echo off
REM Deployment script for Member Service System (Windows)
setlocal enabledelayedexpansion

REM Configuration
set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production
set COMPOSE_FILE=docker-compose.yml
set COMPOSE_PROD_FILE=docker-compose.prod.yml

echo Starting deployment for environment: %ENVIRONMENT%

REM Validate environment
if not "%ENVIRONMENT%"=="development" if not "%ENVIRONMENT%"=="production" (
    echo Error: Environment must be 'development' or 'production'
    exit /b 1
)

REM Check if required environment variables are set for production
if "%ENVIRONMENT%"=="production" (
    if "%JWT_SECRET%"=="" (
        echo Error: Required environment variable JWT_SECRET is not set
        exit /b 1
    )
    if "%ADMIN_JWT_SECRET%"=="" (
        echo Error: Required environment variable ADMIN_JWT_SECRET is not set
        exit /b 1
    )
    if "%POSTGRES_PASSWORD%"=="" (
        echo Error: Required environment variable POSTGRES_PASSWORD is not set
        exit /b 1
    )
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not running
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo Error: docker-compose is not installed
    exit /b 1
)

echo Building and starting services...

REM Build and start services
if "%ENVIRONMENT%"=="production" (
    docker-compose -f %COMPOSE_FILE% -f %COMPOSE_PROD_FILE% --profile prod build --no-cache
    docker-compose -f %COMPOSE_FILE% -f %COMPOSE_PROD_FILE% --profile prod up -d
) else (
    docker-compose --profile dev build --no-cache
    docker-compose --profile dev up -d
)

echo Waiting for services to start...
timeout /t 15 /nobreak >nul

echo Running database migrations...
if "%ENVIRONMENT%"=="production" (
    docker-compose -f %COMPOSE_FILE% -f %COMPOSE_PROD_FILE% exec app npx prisma migrate deploy
) else (
    docker-compose exec app-dev npx prisma migrate dev
)

echo Checking service health...
set /a attempt=1
set /a max_attempts=30

:health_check_loop
curl -f http://localhost:3000/api/health/live >nul 2>&1
if not errorlevel 1 (
    echo Service is healthy!
    goto health_check_success
)

echo Attempt %attempt%/%max_attempts%: Service not ready yet, waiting...
timeout /t 10 /nobreak >nul
set /a attempt+=1
if %attempt% leq %max_attempts% goto health_check_loop

echo Service health check failed after %max_attempts% attempts
exit /b 1

:health_check_success
echo Deployment completed successfully!

echo Service Status:
if "%ENVIRONMENT%"=="production" (
    docker-compose -f %COMPOSE_FILE% -f %COMPOSE_PROD_FILE% ps
) else (
    docker-compose ps
)

echo.
echo Service URLs:
echo API: http://localhost:3000/api
echo Health: http://localhost:3000/api/health
echo Documentation: http://localhost:3000/api/docs

endlocal