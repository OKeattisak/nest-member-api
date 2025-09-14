import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { SecurityService } from '../security.service';
import { LoggerService } from '../../logging/logger.service';

@Injectable()
export class SanitizationPipe implements PipeTransform {
  constructor(
    private readonly securityService: SecurityService,
    private readonly logger: LoggerService,
  ) {}

  transform(value: any, _metadata: ArgumentMetadata) {
    if (!value || typeof value !== 'object') {
      return value;
    }

    try {
      // Check for malicious patterns in the entire object
      const serialized = JSON.stringify(value);
      if (this.securityService.containsMaliciousPatterns(serialized)) {
        this.logger.warn('Malicious pattern detected in request data', 'SanitizationPipe', {
          operation: 'malicious_pattern_detection',
        });
        
        throw new BadRequestException('Request contains potentially malicious content');
      }

      // Sanitize the object
      const sanitized = this.securityService.sanitizeObject(value);
      
      this.logger.debug('Request data sanitized', 'SanitizationPipe', {
        operation: 'request_sanitization',
      });

      return sanitized;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error('Error during request sanitization', undefined, 'SanitizationPipe', {
        operation: 'sanitization_error',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      
      // Return original value if sanitization fails
      return value;
    }
  }
}