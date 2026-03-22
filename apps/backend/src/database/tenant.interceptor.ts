import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
    constructor(private db: DatabaseService) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.userId;

        if (!userId) {
            return next.handle();
        }

        const tenantId = request.headers['x-tenant-id'];
        const storeId = request.headers['x-store-id'];

        if (tenantId) {
            // Verify user belongs to this tenant
            const membership = await this.db.tenantUser.findUnique({
                where: {
                    tenant_id_user_id: {
                        tenant_id: tenantId as string,
                        user_id: userId,
                    },
                },
            });

            if (!membership) {
                throw new UnauthorizedException('Invalid tenant context');
            }

            request.tenantId = tenantId;
        } else {
            const memberships = await this.db.tenantUser.findMany({
                where: { user_id: userId },
                select: { tenant_id: true },
                take: 2,
            });

            if (memberships.length === 1) {
                request.tenantId = memberships[0].tenant_id;
            } else if (memberships.length > 1) {
                throw new BadRequestException('Tenant context is required for this request.');
            }
        }

        if (storeId) {
            request.storeId = storeId;
        }

        return next.handle();
    }
}
