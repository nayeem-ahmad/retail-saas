import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DatabaseService } from '../database/database.service';
export declare class TenantInterceptor implements NestInterceptor {
    private db;
    constructor(db: DatabaseService);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>>;
}
