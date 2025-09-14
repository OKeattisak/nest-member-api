#!/bin/bash

# Database backup script for Member Service System
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CONTAINER_NAME="member-service-postgres"
DATABASE_NAME=${POSTGRES_DB:-member_service_db}
DATABASE_USER=${POSTGRES_USER:-postgres}

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo -e "${GREEN}Starting database backup...${NC}"
echo "Timestamp: $TIMESTAMP"
echo "Database: $DATABASE_NAME"
echo ""

# Function to create database backup
create_backup() {
    local backup_file="$BACKUP_DIR/member_service_backup_$TIMESTAMP.sql"
    
    echo -e "${YELLOW}Creating database backup...${NC}"
    
    if docker exec $CONTAINER_NAME pg_dump -U $DATABASE_USER -d $DATABASE_NAME > $backup_file; then
        echo -e "${GREEN}Backup created successfully: $backup_file${NC}"
        
        # Compress the backup
        gzip $backup_file
        echo -e "${GREEN}Backup compressed: $backup_file.gz${NC}"
        
        # Show backup size
        local backup_size=$(du -h "$backup_file.gz" | cut -f1)
        echo "Backup size: $backup_size"
        
    else
        echo -e "${RED}Backup failed${NC}"
        exit 1
    fi
}

# Function to clean old backups (keep last 7 days)
clean_old_backups() {
    echo -e "${YELLOW}Cleaning old backups (keeping last 7 days)...${NC}"
    
    find $BACKUP_DIR -name "member_service_backup_*.sql.gz" -mtime +7 -delete
    
    local remaining_backups=$(ls -1 $BACKUP_DIR/member_service_backup_*.sql.gz 2>/dev/null | wc -l)
    echo "Remaining backups: $remaining_backups"
}

# Function to list existing backups
list_backups() {
    echo -e "${YELLOW}Existing backups:${NC}"
    ls -lh $BACKUP_DIR/member_service_backup_*.sql.gz 2>/dev/null || echo "No backups found"
}

# Main backup process
main() {
    echo -e "${GREEN}Member Service System Database Backup${NC}"
    
    # Check if container is running
    if ! docker ps | grep -q $CONTAINER_NAME; then
        echo -e "${RED}Error: PostgreSQL container '$CONTAINER_NAME' is not running${NC}"
        exit 1
    fi
    
    # Create backup
    create_backup
    
    # Clean old backups
    clean_old_backups
    
    # List backups
    list_backups
    
    echo -e "${GREEN}Backup process completed successfully!${NC}"
}

# Run main function
main