import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const requestId = (req.headers[REQUEST_ID_HEADER] as string) || randomUUID();
        req.headers[REQUEST_ID_HEADER] = requestId;
        res.setHeader(REQUEST_ID_HEADER, requestId);
        next();
    }
}
