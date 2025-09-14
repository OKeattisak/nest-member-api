-- Initialize PostgreSQL database for Member Service System
-- This script runs when the PostgreSQL container starts for the first time

-- Create additional databases if needed
CREATE DATABASE member_service_test;
CREATE DATABASE member_service_dev;

-- Create a dedicated user for the application (optional)
-- CREATE USER member_service_user WITH PASSWORD 'secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE member_service_db TO member_service_user;
-- GRANT ALL PRIVILEGES ON DATABASE member_service_test TO member_service_user;
-- GRANT ALL PRIVILEGES ON DATABASE member_service_dev TO member_service_user;

-- Enable necessary extensions
\c member_service_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c member_service_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c member_service_dev;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";