import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Consistent error shape across the whole API: { statusCode, message, error, path, timestamp }.
// `message` keeps the stable codes (e.g. phone_taken) that web/mobile map to text.
// Unknown errors become a 500 with a generic message; the stack is logged, never returned.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const asObj = body as Record<string, unknown>;
        message = (asObj.message as string | string[]) ?? exception.message;
        // passport's bare UnauthorizedException has no `error` field: report "Unauthorized",
        // not the class name "UnauthorizedException".
        error =
          (asObj.error as string) ?? (exception.name.replace(/Exception$/, '') || 'Error');
      }
      if (error === 'Internal Server Error') {
        error = exception.name.replace(/Exception$/, '') || 'Error';
      }
    } else {
      // Never leak internals for an unexpected error - log it, return a generic message.
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
