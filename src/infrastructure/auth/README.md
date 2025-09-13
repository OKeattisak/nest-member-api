# Authentication Infrastructure

This module provides comprehensive authentication infrastructure for the member service system with separate JWT configurations for admin and member tokens.

## Components

### Services

#### JwtService
- `generateMemberToken(memberId: string)` - Generate JWT token for members
- `generateAdminToken(adminId: string, role: AdminRole)` - Generate JWT token for admins
- `verifyMemberToken(token: string)` - Verify member JWT token
- `verifyAdminToken(token: string)` - Verify admin JWT token
- `extractTokenFromHeader(authHeader: string)` - Extract Bearer token from header

#### PasswordService
- `hash(password: string)` - Hash password using bcrypt
- `verify(password: string, hash: string)` - Verify password against hash
- `validatePasswordStrength(password: string)` - Validate password strength

### Guards

#### MemberJwtGuard
Protects routes that require member authentication.

```typescript
@UseGuards(MemberJwtGuard)
@Controller('member')
export class MemberController {
  @Get('profile')
  getProfile(@CurrentMember() member: CurrentMemberData) {
    // member.id contains the authenticated member ID
  }
}
```

#### AdminJwtGuard
Protects routes that require admin authentication.

```typescript
@UseGuards(AdminJwtGuard)
@Controller('admin')
export class AdminController {
  @Get('dashboard')
  getDashboard(@CurrentAdmin() admin: CurrentAdminData) {
    // admin.id contains the authenticated admin ID
    // admin.role contains the admin role
  }
}
```

#### RolesGuard
Protects routes that require specific admin roles. Must be used with AdminJwtGuard.

```typescript
@UseGuards(AdminJwtGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  @Post('create-admin')
  @Roles(AdminRole.SUPER_ADMIN)
  createAdmin(@CurrentAdmin() admin: CurrentAdminData) {
    // Only SUPER_ADMIN can access this endpoint
  }
}
```

### Decorators

#### @CurrentMember()
Extracts current member information from the request.

#### @CurrentAdmin()
Extracts current admin information from the request.

#### @Roles(...roles)
Specifies required admin roles for an endpoint.

## Usage Examples

### Member Authentication Flow

```typescript
// 1. Generate token after successful login
const tokens = await jwtService.generateMemberToken(member.id);

// 2. Protect routes
@UseGuards(MemberJwtGuard)
@Get('profile')
async getProfile(@CurrentMember() currentMember: CurrentMemberData) {
  return await memberService.findById(currentMember.id);
}
```

### Admin Authentication Flow

```typescript
// 1. Generate token after successful login
const tokens = await jwtService.generateAdminToken(admin.id, admin.role);

// 2. Protect routes with role-based access
@UseGuards(AdminJwtGuard, RolesGuard)
@Post('members')
@Roles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
async createMember(
  @CurrentAdmin() currentAdmin: CurrentAdminData,
  @Body() createMemberDto: CreateMemberDto
) {
  return await adminService.createMember(createMemberDto);
}
```

### Password Management

```typescript
// Validate password strength
const validation = passwordService.validatePasswordStrength(password);
if (!validation.isValid) {
  throw new BadRequestException(validation.errors);
}

// Hash password
const hashedPassword = await passwordService.hash(password);

// Verify password
const isValid = await passwordService.verify(password, storedHash);
```

## Configuration

The authentication system uses the following environment variables:

- `JWT_SECRET` - Secret key for member tokens (min 32 characters)
- `ADMIN_JWT_SECRET` - Secret key for admin tokens (min 32 characters)
- `JWT_EXPIRES_IN` - Member token expiration (default: 24h)
- `ADMIN_JWT_EXPIRES_IN` - Admin token expiration (default: 8h)
- `BCRYPT_ROUNDS` - Bcrypt salt rounds (default: 12)

## Security Features

- Separate JWT secrets for admin and member tokens
- Password strength validation with multiple criteria
- Secure password hashing with configurable bcrypt rounds
- Role-based access control for admin endpoints
- Token type validation to prevent cross-contamination
- Comprehensive error handling with security-focused messages