# Application Layer

The Application layer is responsible for orchestrating business workflows and implementing use cases. It acts as the intermediary between the Presentation layer (controllers) and the Domain layer (business logic).

## Architecture

This layer follows the **Command Query Responsibility Segregation (CQRS)** pattern and implements use cases as individual classes.

### Structure

```
application/
├── common/                    # Shared application utilities
│   ├── base-use-case.ts      # Base classes for commands and queries
│   └── application-result.ts  # Standardized result wrapper
├── auth/                     # Authentication use cases
│   ├── dto/                  # Application-specific DTOs
│   ├── use-cases/           # Authentication use cases
│   └── auth-application.module.ts
├── member/                   # Member-related use cases
│   ├── dto/                  # Member application DTOs
│   ├── use-cases/           # Member use cases
│   └── member-application.module.ts
└── admin/                    # Admin-related use cases
    ├── dto/                  # Admin application DTOs
    ├── use-cases/           # Admin use cases
    └── admin-application.module.ts
```

## Responsibilities

### 1. Use Case Orchestration
- Coordinates between domain services and repositories
- Implements business workflows that span multiple domains
- Manages transaction boundaries

### 2. Data Transformation
- Converts between domain objects and application DTOs
- Transforms data for presentation layer consumption
- Validates input data before passing to domain layer

### 3. Error Handling
- Provides consistent error handling across use cases
- Returns standardized `ApplicationResult` objects
- Maps domain errors to application-level error codes

### 4. Security & Authorization
- Enforces application-level security rules
- Validates user permissions for specific operations
- Ensures data access compliance

## Use Case Types

### Commands
Commands modify system state and typically don't return data (except confirmation).

Examples:
- `LoginMemberUseCase`
- `RegisterMemberUseCase`
- `ExchangePrivilegeUseCase`
- `AdjustMemberPointsUseCase`

### Queries
Queries retrieve data without modifying system state.

Examples:
- `GetMemberProfileUseCase`
- `GetMemberPointsUseCase`
- `GetAllMembersUseCase`
- `GetSystemStatsUseCase`

## Usage Pattern

### 1. In Controllers
Controllers should inject and call use cases, not domain services directly:

```typescript
@Controller('members')
export class MemberController {
  constructor(
    private readonly getMemberProfileUseCase: GetMemberProfileUseCase,
    private readonly updateMemberProfileUseCase: UpdateMemberProfileUseCase,
  ) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: JwtPayload) {
    const result = await this.getMemberProfileUseCase.execute({
      memberId: user.sub,
    });
    
    if (!result.isSuccess) {
      throw new BadRequestException(result.error);
    }
    
    return result.data;
  }
}
```

### 2. Use Case Implementation
Use cases should inject domain services and orchestrate business logic:

```typescript
@Injectable()
export class GetMemberProfileUseCase extends BaseQuery<GetMemberProfileRequest, ApplicationResult<MemberProfileResponse>> {
  constructor(
    private readonly memberService: MemberService,
  ) {
    super();
  }

  async execute(request: GetMemberProfileRequest): Promise<ApplicationResult<MemberProfileResponse>> {
    try {
      const member = await this.memberService.findById(request.memberId);
      if (!member) {
        return ApplicationResult.failure('Member not found', 'MEMBER_NOT_FOUND');
      }

      return ApplicationResult.success({
        id: member.id,
        email: member.email,
        name: member.name,
        // ... other properties
      });
    } catch (error) {
      return ApplicationResult.failure(error.message, 'GET_PROFILE_FAILED');
    }
  }
}
```

## Benefits

1. **Separation of Concerns**: Clear separation between presentation, application, and domain logic
2. **Testability**: Use cases can be easily unit tested in isolation
3. **Reusability**: Use cases can be reused across different presentation interfaces (REST, GraphQL, etc.)
4. **Consistency**: Standardized error handling and result patterns
5. **Maintainability**: Changes to business workflows are isolated to specific use cases

## Next Steps

To complete the implementation:

1. **Inject Domain Services**: Update use case constructors to inject actual domain services
2. **Implement Business Logic**: Replace TODO comments with actual implementation
3. **Add Validation**: Implement input validation using class-validator
4. **Add Tests**: Create unit tests for each use case
5. **Update Controllers**: Modify existing controllers to use application layer instead of calling domain services directly