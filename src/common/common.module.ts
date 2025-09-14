import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { LoggingModule } from '../infrastructure/logging/logging.module';
import { ValidationModule } from './validation/validation.module';

@Global()
@Module({
  imports: [LoggingModule, ValidationModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [ValidationModule],
})
export class CommonModule {}