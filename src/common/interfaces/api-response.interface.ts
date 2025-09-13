export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponseMeta {
  timestamp: string;
  traceId: string;
  pagination?: PaginationMeta;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta: ApiResponseMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta: ApiResponseMeta;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;