# Database Setup and Management

This directory contains the Prisma schema, migrations, and seeding scripts for the Member Service System.

## Database Schema

The database consists of the following main entities:

- **Members**: User accounts with authentication and profile information
- **Points**: Point transactions with FIFO expiration tracking
- **Privileges**: Available rewards that can be exchanged for points
- **MemberPrivileges**: Junction table tracking granted privileges
- **Admins**: Administrative users with role-based access

## Migration Management

### Initial Setup

1. Ensure PostgreSQL is running and accessible
2. Update the `DATABASE_URL` in your `.env` file
3. Run the initial migration:

```bash
npm run prisma:migrate
```

### Creating New Migrations

When you modify the schema, create a new migration:

```bash
npx prisma migrate dev --name your_migration_name
```

### Production Deployment

For production deployments, use:

```bash
npm run prisma:deploy
```

## Database Seeding

### Development Seeding

Seeds the database with comprehensive sample data for development:

```bash
npm run db:seed
```

This creates:
- 2 admin users (admin and super admin)
- 3 sample members with different point balances
- 4 sample privileges with various costs
- Point transaction history
- Some granted privileges

### Test Seeding

Seeds the database with minimal data for testing:

```bash
npm run db:seed:test
```

This creates:
- 1 test admin
- 1 test member
- 1 test privilege
- Basic point balance

### Database Reset

To clean all data from the database:

```bash
npm run db:reset
```

## Test Credentials

### Development Environment

**Admin Users:**
- Email: `admin@example.com` / Password: `admin123`
- Email: `superadmin@example.com` / Password: `superadmin123`

**Member Users:**
- Email: `john.doe@example.com` / Password: `member123`
- Email: `jane.smith@example.com` / Password: `member123`
- Email: `bob.wilson@example.com` / Password: `member123`

### Test Environment

**Admin User:**
- Email: `test.admin@test.com` / Password: `test123`

**Member User:**
- Email: `test.member@test.com` / Password: `test123`

## Database Schema Details

### Point System FIFO Implementation

The point system implements First-In-First-Out (FIFO) expiration:

- Points are added with expiration dates
- When points are deducted, oldest points are used first
- Expired points are automatically marked as expired
- Balance calculations exclude expired points

### Privilege System

- Privileges have configurable point costs
- Members can exchange points for privileges
- Privileges can have expiration dates
- Admin can manage privilege availability

### Audit Trail

All point transactions are recorded with:
- Transaction type (EARNED, DEDUCTED, EXPIRED, EXCHANGED)
- Timestamps for audit purposes
- Descriptive messages for transaction context

## Troubleshooting

### Connection Issues

If you encounter database connection issues:

1. Verify PostgreSQL is running
2. Check the `DATABASE_URL` in your `.env` file
3. Ensure the database exists
4. Verify user permissions

### Migration Issues

If migrations fail:

1. Check database connectivity
2. Ensure no conflicting schema changes
3. Review migration files for syntax errors
4. Consider resetting the database for development

### Seeding Issues

If seeding fails:

1. Ensure migrations have been applied
2. Check for existing data conflicts
3. Verify bcrypt dependency is installed
4. Review console output for specific errors