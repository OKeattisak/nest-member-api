import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from '../global-exception.filter';
import { DomainException, ValidationException, NotFoundExceptionDomain } from '../../exceptions/domain.exception';
import { RequestContext } from '../../utils/trace.util';
import { LoggerService } from '../../../infrastructure/logging/logger.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { InsufficientPointsException } from '../../../domains/point/exceptions';
import { MemberNotFoundException } from '../../../domains/member/exceptions';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockRequest: any;
  let mockResponse: any;
  let mockLogger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: GlobalExceptionFilter,
          useFactory: () => new GlobalExceptionFilter(mockLogger),
        },
      ],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);

    mockRequest = {
      method: 'GET',
      url: '/test',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent'),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockArgumentsHost = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as any;

    // Set up trace context
    RequestContext.setTraceId('test-trace-id');
  });

  afterEach(() => {
    RequestContext.clear();
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle domain exceptions correctly', () => {
    const exception = new ValidationException('Validation failed', { field: 'email' });
    
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { field: 'email' },
      },
      meta: {
        timestamp: expect.any(String),
        traceId: 'test-trace-id',
      },
    });
  });

  it('should handle NotFoundExceptionDomain correctly', () => {
    const exception = new NotFoundExceptionDomain('User', '123');
    
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: "User with identifier '123' not found",
      },
      meta: {
        timestamp: expect.any(String),
        traceId: 'test-trace-id',
      },
    });
  });

  it('should handle HTTP exceptions correctly', () => {
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'HTTP_EXCEPTION',
        message: 'Bad Request',
      },
      meta: {
        timestamp: expect.any(String),
        traceId: 'test-trace-id',
      },
    });
  });

  it('should handle HTTP exceptions with detailed response', () => {
    const exceptionResponse = {
      error: 'CUSTOM_ERROR',
      message: 'Custom error message',
      details: { field: 'value' },
    };
    const exception = new HttpException(exceptionResponse, HttpStatus.UNPROCESSABLE_ENTITY);
    
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'CUSTOM_ERROR',
        message: 'Custom error message',
        details: { field: 'value' },
      },
      meta: {
        timestamp: expect.any(String),
        traceId: 'test-trace-id',
      },
    });
  });

  it('should handle generic Error instances', () => {
    const exception = new Error('Generic error');
    
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
      meta: {
        timestamp: expect.any(String),
        traceId: 'test-trace-id',
      },
    });
  });

  it('should handle unknown exceptions', () => {
    const exception = 'string exception';
    
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      },
      meta: {
        timestamp: expect.any(String),
        traceId: 'test-trace-id',
      },
    });
  });

  it('should map domain exception codes to correct HTTP status', () => {
    const testCases = [
      { exception: new ValidationException('test'), expectedStatus: HttpStatus.BAD_REQUEST },
      { exception: new NotFoundExceptionDomain('test'), expectedStatus: HttpStatus.NOT_FOUND },
    ];

    testCases.forEach(({ exception, expectedStatus }) => {
      filter.catch(exception, mockArgumentsHost);
      expect(mockResponse.status).toHaveBeenCalledWith(expectedStatus);
    });
  });

  describe('Domain-specific exceptions', () => {
    it('should handle InsufficientPointsException correctly', () => {
      const exception = new InsufficientPointsException(100, 50);
      
      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INSUFFICIENT_POINTS',
          message: 'Insufficient points. Required: 100, Available: 50',
          details: { required: 100, available: 50, deficit: 50 },
        },
        meta: {
          timestamp: expect.any(String),
          traceId: 'test-trace-id',
        },
      });
    });

    it('should handle MemberNotFoundException correctly', () => {
      const exception = new MemberNotFoundException('member-123');
      
      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MEMBER_NOT_FOUND',
          message: "Member with identifier 'member-123' not found",
        },
        meta: {
          timestamp: expect.any(String),
          traceId: 'test-trace-id',
        },
      });
    });
  });

  describe('Prisma exceptions', () => {
    it('should handle PrismaClientKnownRequestError P2002 (unique constraint)', () => {
      const exception = new PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '4.0.0',
        meta: { target: ['email'] },
      });
      
      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: 'A record with this information already exists',
          details: { fields: ['email'] },
        },
        meta: {
          timestamp: expect.any(String),
          traceId: 'test-trace-id',
        },
      });
    });

    it('should handle PrismaClientKnownRequestError P2025 (record not found)', () => {
      const exception = new PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '4.0.0',
      });
      
      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'RECORD_NOT_FOUND',
          message: 'The requested record was not found',
        },
        meta: {
          timestamp: expect.any(String),
          traceId: 'test-trace-id',
        },
      });
    });
  });

  describe('Error logging', () => {
    it('should log domain exceptions with appropriate level', () => {
      const exception = new ValidationException('Validation failed');
      
      filter.catch(exception, mockArgumentsHost);

      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should log unexpected errors with error level', () => {
      const exception = new Error('Unexpected error');
      
      filter.catch(exception, mockArgumentsHost);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Message sanitization', () => {
    it('should sanitize sensitive information in error messages', () => {
      const exception = new Error('Password validation failed for password: secret123');
      
      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'An unexpected error occurred',
          }),
        })
      );
    });
  });

  describe('Error details sanitization', () => {
    it('should sanitize sensitive fields in error details', () => {
      const exception = new ValidationException('Validation failed', {
        field: 'email',
        password: 'secret123',
        token: 'jwt-token',
      });
      
      filter.catch(exception, mockArgumentsHost);

      const call = mockResponse.json.mock.calls[0][0];
      expect(call.error.details.field).toBe('email');
      expect(call.error.details.password).toBe('[REDACTED]');
      expect(call.error.details.token).toBe('[REDACTED]');
    });
  });});
