import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ApiSuccessResponse } from '../interfaces/api-response.interface';
import { RequestContext, TraceUtil } from '../utils/trace.util';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiSuccessResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    // Generate or extract trace ID
    let traceId = request.headers[TraceUtil.getTraceIdHeader()] as string;
    if (!traceId) {
      traceId = TraceUtil.generateTraceId();
    }
    
    // Set trace ID in context and response header
    RequestContext.setTraceId(traceId);
    response.setHeader(TraceUtil.getTraceIdHeader(), traceId);
    
    return next.handle().pipe(
      map((data) => {
        const timestamp = new Date().toISOString();
        
        // Handle different response types
        if (data && typeof data === 'object' && 'success' in data) {
          // Already formatted response
          return data;
        }
        
        // Check if data has pagination info
        let paginationMeta;
        if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
          paginationMeta = data.meta;
          data = data.items;
        }
        
        const response: ApiSuccessResponse<T> = {
          success: true,
          data,
          meta: {
            timestamp,
            traceId,
            ...(paginationMeta && { pagination: paginationMeta }),
          },
        };
        
        return response;
      }),
    );
  }
}