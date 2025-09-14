import { ErrorContextUtil } from '../error-context.util';
import { RequestContext } from '../trace.util';

describe('ErrorContextUtil', () => {
  beforeEach(() => {
    RequestContext.setTraceId('test-trace-id');
  });

  afterEach(() => {
    RequestContext.clear();
  });

  describe('createContext', () => {
    it('should create basic error context', () => {
      const context = ErrorContextUtil.createContext();
      
      expect(context.traceId).toBe('test-trace-id');
      expect(context.timestamp).toBeDefined();
      expect(new Date(context.timestamp)).toBeInstanceOf(Date);
    });

    it('should create context with all parameters', () => {
      const metadata = { key: 'value' };
      const context = ErrorContextUtil.createContext('test-operation', 'user-123', 'member', metadata);
      
      expect(context.traceId).toBe('test-trace-id');
      expect(context.operation).toBe('test-operation');
      expect(context.userId).toBe('user-123');
      expect(context.userType).toBe('member');
      expect(context.metadata).toEqual(metadata);
    });
  });

  describe('createFromRequest', () => {
    it('should create context from request object', () => {
      const mockRequest = {
        url: '/api/test',
        method: 'POST',
        ip: '127.0.0.1',
        user: { id: 'user-123', type: 'member' },
        get: jest.fn().mockReturnValue('test-user-agent'),
      };

      const context = ErrorContextUtil.createFromRequest(mockRequest, 'api-call', { extra: 'data' });
      
      expect(context.traceId).toBe('test-trace-id');
      expect(context.operation).toBe('api-call');
      expect(context.userId).toBe('user-123');
      expect(context.userType).toBe('member');
      expect(context.metadata).toEqual({
        url: '/api/test',
        method: 'POST',
        userAgent: 'test-user-agent',
        ip: '127.0.0.1',
        extra: 'data',
      });
    });

    it('should handle request without user', () => {
      const mockRequest = {
        url: '/api/test',
        method: 'GET',
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('test-user-agent'),
      };

      const context = ErrorContextUtil.createFromRequest(mockRequest);
      
      expect(context.userId).toBeUndefined();
      expect(context.userType).toBeUndefined();
      expect(context.metadata?.url).toBe('/api/test');
    });
  });

  describe('enhanceError', () => {
    it('should enhance error with context', () => {
      const error = new Error('Test error');
      const context = ErrorContextUtil.createContext('test-op');
      
      const enhancedError = ErrorContextUtil.enhanceError(error, context);
      
      expect(enhancedError).toBe(error);
      expect((enhancedError as any).context).toEqual(context);
    });
  });

  describe('extractContext', () => {
    it('should extract context from enhanced error', () => {
      const error = new Error('Test error');
      const context = ErrorContextUtil.createContext('test-op');
      
      ErrorContextUtil.enhanceError(error, context);
      const extractedContext = ErrorContextUtil.extractContext(error);
      
      expect(extractedContext).toEqual(context);
    });

    it('should return undefined for non-enhanced error', () => {
      const error = new Error('Test error');
      const extractedContext = ErrorContextUtil.extractContext(error);
      
      expect(extractedContext).toBeUndefined();
    });
  });

  describe('createSanitizedDetails', () => {
    it('should create sanitized details without stack', () => {
      const error = new Error('Test error');
      const context = ErrorContextUtil.createContext('test-op', 'user-123', 'member', {
        safe: 'value',
        password: 'secret',
      });
      
      ErrorContextUtil.enhanceError(error, context);
      const details = ErrorContextUtil.createSanitizedDetails(error, false);
      
      expect(details.timestamp).toBeDefined();
      expect(details.traceId).toBe('test-trace-id');
      expect(details.operation).toBe('test-op');
      expect(details.stack).toBeUndefined();
      expect(details.metadata.safe).toBe('value');
      expect(details.metadata.password).toBe('[REDACTED]');
    });

    it('should include stack when requested', () => {
      const error = new Error('Test error');
      const context = ErrorContextUtil.createContext('test-op');
      
      ErrorContextUtil.enhanceError(error, context);
      const details = ErrorContextUtil.createSanitizedDetails(error, true);
      
      expect(details.stack).toBeDefined();
    });

    it('should handle error without context', () => {
      const error = new Error('Test error');
      const details = ErrorContextUtil.createSanitizedDetails(error);
      
      expect(details.timestamp).toBeDefined();
      expect(details.traceId).toBe('test-trace-id');
      expect(details.operation).toBeUndefined();
    });
  });

  describe('sanitizeMetadata', () => {
    it('should sanitize sensitive keys', () => {
      const metadata = {
        safe: 'value',
        password: 'secret',
        token: 'jwt-token',
        authorization: 'Bearer token',
        nested: {
          safe: 'value',
          secret: 'hidden',
        },
      };

      const context = ErrorContextUtil.createContext('test', undefined, undefined, metadata);
      const details = ErrorContextUtil.createSanitizedDetails({ context } as any);
      
      expect(details.metadata.safe).toBe('value');
      expect(details.metadata.password).toBe('[REDACTED]');
      expect(details.metadata.token).toBe('[REDACTED]');
      expect(details.metadata.authorization).toBe('[REDACTED]');
      expect(details.metadata.nested.safe).toBe('value');
      expect(details.metadata.nested.secret).toBe('[REDACTED]');
    });
  });
});