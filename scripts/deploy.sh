#!/bin/bash

# Deployment script for Member Service System
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.yml"
COMPOSE_PROD_FILE="docker-compose.prod.yml"

echo -e "${GREEN}Starting deployment for environment: ${ENVIRONMENT}${NC}"

# Validate environment
if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "production" ]]; then
    echo -e "${RED}Error: Environment must be 'development' or 'production'${NC}"
    exit 1
fi

# Check if required environment variables are set for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    required_vars=("JWT_SECRET" "ADMIN_JWT_SECRET" "POSTGRES_PASSWORD")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            echo -e "${RED}Error: Required environment variable $var is not set${NC}"
            exit 1
        fi
    done
fi

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}Error: Docker is not running${NC}"
        exit 1
    fi
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Error: docker-compose is not installed${NC}"
        exit 1
    fi
}

# Function to build and start services
deploy_services() {
    echo -e "${YELLOW}Building and starting services...${NC}"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        docker-compose -f $COMPOSE_FILE -f $COMPOSE_PROD_FILE --profile prod build --no-cache
        docker-compose -f $COMPOSE_FILE -f $COMPOSE_PROD_FILE --profile prod up -d
    else
        docker-compose --profile dev build --no-cache
        docker-compose --profile dev up -d
    fi
}

# Function to run database migrations
run_migrations() {
    echo -e "${YELLOW}Running database migrations...${NC}"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        docker-compose -f $COMPOSE_FILE -f $COMPOSE_PROD_FILE exec app npx prisma migrate deploy
    else
        docker-compose exec app-dev npx prisma migrate dev
    fi
}

# Function to check service health
check_health() {
    echo -e "${YELLOW}Checking service health...${NC}"
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if [[ "$ENVIRONMENT" == "production" ]]; then
            if curl -f http://localhost:3000/api/health/live > /dev/null 2>&1; then
                echo -e "${GREEN}Service is healthy!${NC}"
                return 0
            fi
        else
            if curl -f http://localhost:3000/api/health/live > /dev/null 2>&1; then
                echo -e "${GREEN}Service is healthy!${NC}"
                return 0
            fi
        fi
        
        echo "Attempt $attempt/$max_attempts: Service not ready yet, waiting..."
        sleep 10
        ((attempt++))
    done
    
    echo -e "${RED}Service health check failed after $max_attempts attempts${NC}"
    return 1
}

# Function to show service status
show_status() {
    echo -e "${YELLOW}Service Status:${NC}"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        docker-compose -f $COMPOSE_FILE -f $COMPOSE_PROD_FILE ps
    else
        docker-compose ps
    fi
}

# Function to show logs
show_logs() {
    echo -e "${YELLOW}Recent logs:${NC}"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        docker-compose -f $COMPOSE_FILE -f $COMPOSE_PROD_FILE logs --tail=50 app
    else
        docker-compose logs --tail=50 app-dev
    fi
}

# Main deployment process
main() {
    echo -e "${GREEN}Member Service System Deployment${NC}"
    echo "Environment: $ENVIRONMENT"
    echo "Timestamp: $(date)"
    echo ""
    
    # Pre-deployment checks
    check_docker
    check_docker_compose
    
    # Deploy services
    deploy_services
    
    # Wait a bit for services to start
    echo -e "${YELLOW}Waiting for services to start...${NC}"
    sleep 15
    
    # Run migrations
    run_migrations
    
    # Check health
    if check_health; then
        echo -e "${GREEN}Deployment completed successfully!${NC}"
        show_status
        
        echo ""
        echo -e "${GREEN}Service URLs:${NC}"
        echo "API: http://localhost:3000/api"
        echo "Health: http://localhost:3000/api/health"
        echo "Documentation: http://localhost:3000/api/docs"
        
    else
        echo -e "${RED}Deployment failed - service health check failed${NC}"
        show_logs
        exit 1
    fi
}

# Run main function
main