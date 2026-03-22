import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from '../database/database.service';
import { SUBSCRIPTION_PLAN_KEY } from './subscription-access.decorator';

@Injectable()
export class SubscriptionAccessGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly db: DatabaseService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPlan = this.reflector.getAllAndOverride<'BASIC' | 'PREMIUM' | undefined>(SUBSCRIPTION_PLAN_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPlan || requiredPlan === 'BASIC') {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const userId = request.user?.userId;
        const tenantIdHeader = request.headers['x-tenant-id'];
        const tenantId = Array.isArray(tenantIdHeader) ? tenantIdHeader[0] : tenantIdHeader;

        if (!userId || !tenantId) {
            throw new UnauthorizedException('Missing tenant context');
        }

        const membership = await this.db.tenantUser.findUnique({
            where: {
                tenant_id_user_id: {
                    tenant_id: tenantId,
                    user_id: userId,
                },
            },
        });

        if (!membership) {
            throw new UnauthorizedException('Invalid tenant context');
        }

        const subscription = await this.db.tenantSubscription.findUnique({
            where: { tenant_id: tenantId },
            include: { plan: true },
        });

        const hasPremium =
            subscription?.plan.code === 'PREMIUM' &&
            (subscription.status === 'ACTIVE' || subscription.status === 'TRIALING');

        if (!hasPremium) {
            throw new ForbiddenException('This feature requires an active Premium subscription.');
        }

        request.subscription = subscription;
        return true;
    }
}