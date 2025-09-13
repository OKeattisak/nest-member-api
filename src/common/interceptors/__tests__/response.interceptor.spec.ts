import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseInterceptor } from '../response.interceptor';
import { RequestContext, TraceUtil } from '../../utils/trace.util';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<any>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResponseInterceptor],
    }).compile();

    interceptor = module.get<ResponseInterceptor<any>>(ResponseInterceptor);

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      setHeader: jest.fn(),
    };

    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    };

    // Clear context before each test
    RequestContext.clear();
  });

  afterEach(() => {
    RequestContext.clear();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should generate trace ID when not provided in headers', (done) => {
    const testData = { message: 'test' };
    mockCallHandler.handle = jest.fn(() => of(testData));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result.success).toBe(true);
      expect(result.data).toEqual(testData);
      expect(result.meta.traceId).toBeDefined();
      expect(result.meta.timestamp).toBeDefined();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        TraceUtil.getTraceIdHeader(),
        expect.any(String)
      );
      done();
    });
  });

  it('should use existing trace ID from headers', (done) => {
    const existingTraceId = 'existing-trace-id';
    mockRequest.headers[TraceUtil.getTraceIdHeader()] = existingTraceId;
    
    const testData = { message: 'test' };
    mockCallHandler.handle = jest.fn(() => of(testData));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result.meta.traceId).toBe(existingTraceId);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        TraceUtil.getTraceIdHeader(),
        existingTraceId
      );
      done();
    });
  });

  it('should handle already formatted responses', (done) => {
    const formattedResponse = {
      success: true,
      data: { message: 'test' },
      meta: {
        timestamp: '2023-01-01T00:00:00.000Z',
        traceId: 'test-trace-id',
      },
    };
    
    mockCallHandler.handle = jest.fn(() => of(formattedResponse));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual(formattedResponse);
      done();
    });
  });

  it('should handle paginated responses', (done) => {
    const paginatedData = {
      items: [{ id: 1 }, { id: 2 }],
      meta: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };
    
    mockCallHandler.handle = jest.fn(() => of(paginatedData));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result.success).toBe(true);
      expect(result.data).toEqual(paginatedData.items);
      expect(result.meta.pagination).toEqual(paginatedData.meta);
      done();
    });
  });

  it('should format simple data responses', (done) => {
    const testData = { id: 1, name: 'test' };
    mockCallHandler.handle = jest.fn(() => of(testData));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe((result) => {
      expect(result.success).toBe(true);
      expect(result.data).toEqual(testData);
      expect(result.meta.traceId).toBeDefined();
      expect(result.meta.timestamp).toBeDefined();
      expect(result.meta.pagination).toBeUndefined();
      done();
    });
  });
});