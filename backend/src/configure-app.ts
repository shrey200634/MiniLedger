import {
  BadRequestException,
  INestApplication,
  ValidationError,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';

interface FieldError {
  field: string;
  message: string;
}

function flattenErrors(errors: ValidationError[], parent = ''): FieldError[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = Object.values(error.constraints ?? {}).map((message) => ({
      field,
      message,
    }));
    return [...own, ...flattenErrors(error.children ?? [], field)];
  });
}

/** Shared by main.ts and the e2e tests so both behave identically. */
export function configureApp(app: INestApplication): void {
  app.use(requestIdMiddleware);
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: flattenErrors(errors),
        }),
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
}
