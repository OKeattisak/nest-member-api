#!/bin/bash

# Database restore script for Member Service System
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
CONTAINER_NAME="member-service-postgres"
DATABASE_NAME=${POSTGRES_DB:-member_service_db}
DATABASE_USER=${POSTGRES_USER:-postgres}

# Function to list available backups
list_backups() {
    echo -e "${YELLOW}Available backups:${NC}"
    local backups=($(ls -1 $BACKUP_DIR/member_service_backup_*.sql.gz 2>/dev/null | sort -r))
    
    if [[ ${#backups[@]} -eq 0 ]]; then
        echo "No backups found in $BACKUP_DIR"
        exit 1
    fi
    
    for i in "${!backups[@]}"; do
        local backup_file="${backups[$i]}"
        local backup_date=$(basename "$backup_file" | sed 's/member_service_backup_\(.*\)\.sql\.gz/\1/')
        local backup_size=$(du -h "$backup_file" | cut -f1)
        echo "$((i+1)). $(basename "$backup_file") (Size: $backup_size, Date: $backup_date)"
    done
    
    echo ""
    echo -n "Select backup to restore (1-${#backups[@]}): "
    read -r selection
    
    if [[ ! "$selection" =~ ^[0-9]+$ ]] || [[ "$selection" -lt 1 ]] || [[ "$selection" -gt ${#backups[@]} ]]; then
        echo -e "${RED}Invalid selection${NC}"
        exit 1
    fi
    
    SELECTED_BACKUP="${backups[$((selection-1))]}"
}

# Function to confirm restore operation
confirm_restore() {
    echo -e "${YELLOW}WARNING: This will completely replace the current database!${NC}"
    echo "Selected backup: $(basename "$SELECTED_BACKUP")"
    echo "Target database: $DATABASE_NAME"
    echo ""
    echo -n "Are you sure you want to continue? (yes/no): "
    read -r confirmation
    
    if [[ "$confirmation" != "yes" ]]; then
        echo "Restore cancelled"
        exit 0
    fi
}

# Function to restore database
restore_database() {
    echo -e "${YELLOW}Restoring database from backup...${NC}"
    
    # Create a temporary uncompressed file
    local temp_file="/tmp/restore_$(date +%s).sql"
    
    # Decompress backup
    echo "Decompressing backup..."
    gunzip -c "$SELECTED_BACKUP" > "$temp_file"
    
    # Copy to container
    echo "Copying backup to container..."
    docker cp "$temp_file" "$CONTAINER_NAME:/tmp/restore.sql"
    
    # Drop existing database and recreate
    echo "Dropping existing database..."
    docker exec $CONTAINER_NAME psql -U $DATABASE_USER -c "DROP DATABASE IF EXISTS $DATABASE_NAME;"
    
    echo "Creating new database..."
    docker exec $CONTAINER_NAME psql -U $DATABASE_USER -c "CREATE DATABASE $DATABASE_NAME;"
    
    # Restore database
    echo "Restoring database..."
    if docker exec $CONTAINER_NAME psql -U $DATABASE_USER -d $DATABASE_NAME -f /tmp/restore.sql; then
        echo -e "${GREEN}Database restored successfully!${NC}"
    else
        echo -e "${RED}Database restore failed${NC}"
        exit 1
    fi
    
    # Clean up
    echo "Cleaning up temporary files..."
    rm -f "$temp_file"
    docker exec $CONTAINER_NAME rm -f /tmp/restore.sql
}

# Function to verify restore
verify_restore() {
    echo -e "${YELLOW}Verifying restore...${NC}"
    
    # Check if tables exist
    local table_count=$(docker exec $CONTAINER_NAME psql -U $DATABASE_USER -d $DATABASE_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    
    if [[ $table_count -gt 0 ]]; then
        echo -e "${GREEN}Restore verification successful - found $table_count tables${NC}"
    else
        echo -e "${RED}Restore verification failed - no tables found${NC}"
        exit 1
    fi
}

# Main restore process
main() {
    echo -e "${GREEN}Member Service System Database Restore${NC}"
    echo ""
    
    # Check if container is running
    if ! docker ps | grep -q $CONTAINER_NAME; then
        echo -e "${RED}Error: PostgreSQL container '$CONTAINER_NAME' is not running${NC}"
        exit 1
    fi
    
    # List and select backup
    list_backups
    
    # Confirm restore
    confirm_restore
    
    # Restore database
    restore_database
    
    # Verify restore
    verify_restore
    
    echo -e "${GREEN}Database restore completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Restart the application containers"
    echo "2. Run any necessary database migrations"
    echo "3. Verify application functionality"
}

# Check if backup directory exists
if [[ ! -d "$BACKUP_DIR" ]]; then
    echo -e "${RED}Error: Backup directory '$BACKUP_DIR' does not exist${NC}"
    exit 1
fi

# Run main function
main