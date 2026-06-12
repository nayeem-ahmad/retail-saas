import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
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

        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred',
            },
        });
    }
}