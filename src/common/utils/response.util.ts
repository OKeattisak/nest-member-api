import { ApiSuccessResponse, PaginationMeta } from '../interfaces/api-response.interface';
import { RequestContext } from './trace.util';

export class ResponseUtil {
  static success<T>(data: T, message?: string): ApiSuccessResponse<T> {
    return {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        traceId: RequestContext.getTraceId(),
      },
    };
  }

  static successWithPagination<T>(
    data: T[],
    pagination: PaginationMeta,
    message?: string
  ): ApiSuccessResponse<T[]> {
    return {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        traceId: RequestContext.getTraceId(),
        pagination,
      },
    };
  }

  static createPaginationMeta(
    page: number,
    limit: number,
    total: number
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}