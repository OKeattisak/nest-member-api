import { ResponseUtil } from '../response.util';
import { RequestContext } from '../trace.util';

describe('ResponseUtil', () => {
  beforeEach(() => {
    RequestContext.setTraceId('test-trace-id');
  });

  afterEach(() => {
    RequestContext.clear();
  });

  describe('success', () => {
    it('should create a success response with data', () => {
      const testData = { id: 1, name: 'test' };
      const response = ResponseUtil.success(testData);

      expect(response).toEqual({
        success: true,
        data: testData,
        meta: {
          timestamp: expect.any(String),
          traceId: 'test-trace-id',
        },
      });
    });

    it('should create a success response with data and message', () => {
      const testData = { id: 1, name: 'test' };
      const message = 'Operation successful';
      const response = ResponseUtil.success(testData, message);

      expect(response).toEqual({
        success: true,
        data: testData,
        message,
        meta: {
          timestamp: expect.any(String),
          traceId: 'test-trace-id',
        },
      });
    });

    it('should include valid ISO timestamp', () => {
      const response = ResponseUtil.success({});
      const timestamp = new Date(response.meta.timestamp);
      
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  describe('successWithPagination', () => {
    it('should create a paginated success response', () => {
      const testData = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      const response = ResponseUtil.successWithPagination(testData, pagination);

      expect(response).toEqual({
        success: true,
        data: testData,
        meta: {
          timestamp: expect.any(String),
          traceId: 'test-trace-id',
          pagination,
        },
      });
    });

    it('should create a paginated success response with message', () => {
      const testData = [{ id: 1 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };
      const message = 'Data retrieved successfully';

      const response = ResponseUtil.successWithPagination(testData, pagination, message);

      expect(response).toEqual({
        success: true,
        data: testData,
        message,
        meta: {
          timestamp: expect.any(String),
          traceId: 'test-trace-id',
          pagination,
        },
      });
    });
  });

  describe('createPaginationMeta', () => {
    it('should create pagination metadata for first page', () => {
      const meta = ResponseUtil.createPaginationMeta(1, 10, 25);

      expect(meta).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      });
    });

    it('should create pagination metadata for middle page', () => {
      const meta = ResponseUtil.createPaginationMeta(2, 10, 25);

      expect(meta).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      });
    });

    it('should create pagination metadata for last page', () => {
      const meta = ResponseUtil.createPaginationMeta(3, 10, 25);

      expect(meta).toEqual({
        page: 3,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: false,
        hasPrev: true,
      });
    });

    it('should handle single page scenario', () => {
      const meta = ResponseUtil.createPaginationMeta(1, 10, 5);

      expect(meta).toEqual({
        page: 1,
        limit: 10,
        total: 5,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should handle empty results', () => {
      const meta = ResponseUtil.createPaginationMeta(1, 10, 0);

      expect(meta).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
    });
  });
});