import { TraceUtil, RequestContext } from '../trace.util';

describe('TraceUtil', () => {
  describe('generateTraceId', () => {
    it('should generate a valid UUID', () => {
      const traceId = TraceUtil.generateTraceId();
      
      expect(traceId).toBeDefined();
      expect(typeof traceId).toBe('string');
      expect(traceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should generate unique trace IDs', () => {
      const traceId1 = TraceUtil.generateTraceId();
      const traceId2 = TraceUtil.generateTraceId();
      
      expect(traceId1).not.toBe(traceId2);
    });
  });

  describe('getTraceIdHeader', () => {
    it('should return the correct header name', () => {
      expect(TraceUtil.getTraceIdHeader()).toBe('x-trace-id');
    });
  });
});

describe('RequestContext', () => {
  beforeEach(() => {
    RequestContext.clear();
  });

  afterEach(() => {
    RequestContext.clear();
  });

  describe('setTraceId and getTraceId', () => {
    it('should store and retrieve trace ID', () => {
      const testTraceId = 'test-trace-id-123';
      
      RequestContext.setTraceId(testTraceId);
      const retrievedTraceId = RequestContext.getTraceId();
      
      expect(retrievedTraceId).toBe(testTraceId);
    });

    it('should generate new trace ID when none is set', () => {
      const traceId = RequestContext.getTraceId();
      
      expect(traceId).toBeDefined();
      expect(typeof traceId).toBe('string');
      expect(traceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('clear', () => {
    it('should clear stored trace ID', () => {
      RequestContext.setTraceId('test-trace-id');
      RequestContext.clear();
      
      // Should generate new one since storage is cleared
      const traceId = RequestContext.getTraceId();
      expect(traceId).not.toBe('test-trace-id');
    });
  });
});