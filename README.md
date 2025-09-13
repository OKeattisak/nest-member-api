# Member Service System

A comprehensive NestJS application implementing a point-based membership system with privilege exchange functionality, built following Domain-Driven Design principles.

## Features

- Member registration and authentication
- Point system with FIFO expiration
- Privilege exchange functionality
- Admin management interface
- JWT-based authentication (separate for admins and members)
- Comprehensive logging and tracing
- PostgreSQL database with Prisma ORM

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with Passport
- **Validation**: class-validator, class-transformer
- **Configuration**: @nestjs/config with Joi validation
- **Testing**: Jest

## Project Structure

```
src/
├── main.ts                    # Application entry point
├── app.module.ts             # Root module
├── common/                   # Shared utilities
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── dto/
├── domains/                  # Domain layer (DDD)
│   ├── member/
│   ├── point/
│   └── privilege/
├── application/              # Application layer
│   ├── admin/
│   ├── member/
│   └── auth/
├── infrastructure/           # Infrastructure layer
│   ├── database/
│   ├── logging/
│   ├── config/
│   └── prisma/
└── presentation/            # Presentation layer
    ├── controllers/
    └── middleware/
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your database connection and JWT secrets

5. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

6. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```

### Development

Start the development server:
```bash
npm run start:dev
```

The application will be available at `http://localhost:3000`

### Available Scripts

- `npm run build` - Build the application
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Application port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT secret for members | Required (min 32 chars) |
| `ADMIN_JWT_SECRET` | JWT secret for admins | Required (min 32 chars) |
| `JWT_EXPIRES_IN` | Member token expiration | `24h` |
| `ADMIN_JWT_EXPIRES_IN` | Admin token expiration | `8h` |
| `BCRYPT_ROUNDS` | Password hashing rounds | `12` |
| `POINT_EXPIRATION_DAYS` | Default point expiration | `365` |

## Database Schema

The application uses the following main entities:

- **Member**: User accounts with profile information
- **Point**: Point transactions with FIFO expiration
- **Privilege**: Available rewards/benefits
- **MemberPrivilege**: Granted privileges to members
- **Admin**: Administrative users

## Architecture

The application follows Domain-Driven Design (DDD) principles with clear separation of concerns:

- **Domain Layer**: Contains business entities and domain logic
- **Application Layer**: Orchestrates use cases and application services
- **Infrastructure Layer**: Handles external concerns (database, logging, etc.)
- **Presentation Layer**: HTTP controllers and middleware

## Contributing

1. Follow the established project structure
2. Write tests for new features
3. Ensure TypeScript strict mode compliance
4. Follow the existing code style and conventions

## License

This project is licensed under the ISC License.