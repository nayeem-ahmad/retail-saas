import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const body = exception.getResponse();
            const message = typeof body === 'string'
                ? body
                : (body as { message?: string | string[] }).message;
            const code = typeof body === 'object' && body !== null && 'code' in body
                ? String((body as { code?: string }).code)
                : HttpStatus[status] ?? 'HTTP_ERROR';

            response.status(status).json({
                error: {
                    code,
                    message: Array.isArray(message) ? message.join(', ') : (message ?? exception.message),
                },
            });
            return;
        }

        this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred',
            },
        });
    }
}