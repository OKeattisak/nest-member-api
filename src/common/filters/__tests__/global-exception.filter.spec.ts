import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from '../global-exception.filter';
import { DomainException, ValidationException, NotFoundExceptionDomain } from '../../exceptions/domain.exception';
import { RequestContext } from '../../utils/trace.util';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlobalExceptionFilter],
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
});