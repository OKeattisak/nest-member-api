import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class CustomValidationPipe extends NestValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (!metadata.metatype || !this.toValidate(metadata.metatype)) {
      return value;
    }

    const object = plainToClass(metadata.metatype, value);
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validateCustomDecorators: true,
    });

    if (errors.length > 0) {
      const formattedErrors = this.formatErrors(errors);
      throw new BadRequestException({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: formattedErrors,
        },
      });
    }

    return object;
  }

  protected toValidate(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: ValidationError[]): any {
    const result: any = {};

    errors.forEach((error) => {
      if (error.children && error.children.length > 0) {
        result[error.property] = this.formatErrors(error.children);
      } else {
        result[error.property] = Object.values(error.constraints || {});
      }
    });

    return result;
  }
}