import { randomUUID } from 'crypto';

export class TraceUtil {
  private static readonly TRACE_ID_HEADER = 'x-trace-id';
  
  static generateTraceId(): string {
    return randomUUID();
  }
  
  static getTraceIdHeader(): string {
    return this.TRACE_ID_HEADER;
  }
}

// Request context storage for trace ID
export class RequestContext {
  private static storage = new Map<string, string>();
  
  static setTraceId(traceId: string): void {
    this.storage.set('traceId', traceId);
  }
  
  static getTraceId(): string {
    return this.storage.get('traceId') || TraceUtil.generateTraceId();
  }
  
  static clear(): void {
    this.storage.clear();
  }
}