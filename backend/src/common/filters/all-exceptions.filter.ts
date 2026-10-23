import { randomUUID } from 'node:crypto';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface MappedError {
  status: number;
  code: string;
  message: string;
  details: unknown;
}

const INTERNAL_ERROR: MappedError = {
  status: 500,
  code: 'INTERNAL_ERROR',
  message: 'Something went wrong. Please try again.',
  details: null,
};

function isPrismaKnownError(error: unknown): error is Error & { code: string } {
  return (
    error instanceof Error &&
    error.name === 'PrismaClientKnownRequestError' &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

function isMalformedJson(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { type?: unknown }).type === 'entity.parse.failed'
  );
}

function messageOf(body: unknown, fallback: string): string {
  if (typeof body === 'string') {
    return body;
  }
  if (typeof body === 'object' && body !== null) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return fallback;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    if (res.headersSent) {
      return;
    }

    const requestId =
      typeof res.locals.requestId === 'string'
        ? res.locals.requestId
        : randomUUID();
    const mapped = this.map(exception);

    if (mapped.status >= 500) {
      // Full detail stays in the server log; the client only gets a generic message.
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        `[${requestId}] ${req.method} ${req.originalUrl} -> ${mapped.status}`,
        stack ?? String(exception),
      );
    }

    res.status(mapped.status).json({
      error: {
        code: mapped.code,
        message: mapped.message,
        details: mapped.details ?? null,
        requestId,
      },
    });
  }

  private map(exception: unknown): MappedError {
    if (exception instanceof HttpException) {
      return this.mapHttpException(exception);
    }
    if (isPrismaKnownError(exception)) {
      if (exception.code === 'P2002') {
        return {
          status: 409,
          code: 'CONFLICT',
          message: 'Resource already exists',
          details: null,
        };
      }
      if (exception.code === 'P2025') {
        return {
          status: 404,
          code: 'NOT_FOUND',
          message: 'Resource not found',
          details: null,
        };
      }
    }
    if (isMalformedJson(exception)) {
      return {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON body',
        details: null,
      };
    }
    return INTERNAL_ERROR;
  }

  private mapHttpException(exception: HttpException): MappedError {
    const status = exception.getStatus();
    const body = exception.getResponse();

    // Domain exceptions and our ValidationPipe carry an explicit stable code.
    if (typeof body === 'object' && body !== null) {
      const { code, message, details } = body as {
        code?: unknown;
        message?: unknown;
        details?: unknown;
      };
      if (typeof code === 'string') {
        return {
          status,
          code,
          message: typeof message === 'string' ? message : exception.message,
          details: details ?? null,
        };
      }
    }

    // Plain Nest exceptions (guards, pipes, router) are mapped by status.
    switch (status) {
      case 400:
        return {
          status,
          code: 'VALIDATION_ERROR',
          message: messageOf(body, 'Validation failed'),
          details: null,
        };
      case 401:
        return {
          status,
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          details: null,
        };
      case 404:
        return {
          status,
          code: 'ROUTE_NOT_FOUND',
          message: 'Route not found',
          details: null,
        };
      case 429:
        return {
          status,
          code: 'RATE_LIMITED',
          message: 'Too many requests',
          details: null,
        };
      default:
        return INTERNAL_ERROR;
    }
  }
}
