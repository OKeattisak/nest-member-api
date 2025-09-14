import { Controller, Post, Body, HttpCode, HttpStatus, Logger, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { 
  MemberRegisterDto, 
  MemberLoginDto, 
  MemberLoginResponseDto,
  MemberProfileResponseDto 
} from '@/domains/member/dto/member-auth.dto';
import { ApiSuccessResponse } from '@/common/interfaces/api-response.interface';
import { RegisterThrottle, LoginThrottle } from '@/infrastructure/security/decorators/auth-throttle.decorator';

// Import Application Layer Use Cases
import { LoginMemberUseCase } from '../../application/auth/use-cases/login-member.use-case';
import { RegisterMemberUseCase } from '../../application/auth/use-cases/register-member.use-case';

@ApiTags('Member Auth')
@Controller('member/auth')
export class MemberAuthUpdatedController {
  private readonly logger = new Logger(MemberAuthUpdatedController.name);

  constructor(
    // Inject Application Layer Use Cases instead of Domain Services
    private readonly loginMemberUseCase: LoginMemberUseCase,
    private readonly registerMemberUseCase: RegisterMemberUseCase,
  ) {}

  @Post('register')
  @RegisterThrottle()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Member registration',
    description: 'Register a new member account'
  })
  @ApiBody({
    type: MemberRegisterDto,
    description: 'Member registration data',
    examples: {
      example1: {
        summary: 'Member registration example',
        value: {
          email: 'member@example.com',
          username: 'member123',
          password: 'securePassword123',
          firstName: 'John',
          lastName: 'Doe'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clm123456789' },
            email: { type: 'string', example: 'member@example.com' },
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            member: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'clm123456789' },
                email: { type: 'string', example: 'member@example.com' },
                name: { type: 'string', example: 'John Doe' },
                totalPoints: { type: 'number', example: 0 }
              }
            }
          }
        },
        message: { type: 'string', example: 'Registration successful' }
      }
    }
  })
  async register(@Body() registerDto: MemberRegisterDto): Promise<ApiSuccessResponse<any>> {
    this.logger.log(`Member registration attempt for: ${registerDto.email}`);

    // Use Application Layer Use Case
    const result = await this.registerMemberUseCase.execute({
      email: registerDto.email,
      password: registerDto.password,
      name: `${registerDto.firstName} ${registerDto.lastName}`,
    });

    // Handle Application Result
    if (!result.isSuccess) {
      this.logger.warn(`Registration failed for ${registerDto.email}: ${result.error}`);
      throw new BadRequestException(result.error);
    }

    this.logger.log(`Successfully registered member: ${registerDto.email}`);

    return {
      success: true,
      data: result.data,
      message: 'Registration successful',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }

  @Post('login')
  @LoginThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Member login',
    description: 'Authenticate a member and return JWT token'
  })
  @ApiBody({
    type: MemberLoginDto,
    description: 'Member login credentials',
    examples: {
      example1: {
        summary: 'Member login example',
        value: {
          emailOrUsername: 'member@example.com',
          password: 'securePassword123'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            member: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'clm123456789' },
                email: { type: 'string', example: 'member@example.com' },
                name: { type: 'string', example: 'John Doe' },
                totalPoints: { type: 'number', example: 1500 }
              }
            }
          }
        },
        message: { type: 'string', example: 'Login successful' }
      }
    }
  })
  async login(@Body() loginDto: MemberLoginDto): Promise<ApiSuccessResponse<any>> {
    this.logger.log(`Member login attempt for: ${loginDto.emailOrUsername}`);

    // Use Application Layer Use Case
    const result = await this.loginMemberUseCase.execute({
      email: loginDto.emailOrUsername,
      password: loginDto.password,
    });

    // Handle Application Result
    if (!result.isSuccess) {
      this.logger.warn(`Login failed for ${loginDto.emailOrUsername}: ${result.error}`);
      throw new BadRequestException(result.error);
    }

    this.logger.log(`Successful member login for: ${loginDto.emailOrUsername}`);

    return {
      success: true,
      data: result.data,
      message: 'Login successful',
      meta: {
        timestamp: new Date().toISOString(),
        traceId: 'generated-trace-id',
      },
    };
  }
}