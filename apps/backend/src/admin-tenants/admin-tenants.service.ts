import { Injectable, NotFoundException } from '@nestjs/common';
import { BillingService } from '../billing/billing.service';
import { DatabaseService } from '../database/database.service';
import {
    ListAdminTenantsQueryDto,
    UpdateAdminTenantSubscriptionDto,
} from './admin-tenants.dto';

@Injectable()
export class AdminTenantsService {
    constructor(
        private readonly db: DatabaseService,
        private readonly billingService: BillingService,
    ) {}

    async listTenants(query: ListAdminTenantsQueryDto) {
        const tenants = await this.db.tenant.findMany({
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
                stores: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                users: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                            },
                        },
                    },
                },
                subscription: {
                    include: { plan: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });

        return tenants
            .filter((tenant) => {
                const normalizedSearch = query.search?.trim().toLowerCase();
                const matchesSearch = !normalizedSearch || [
                    tenant.name,
                    tenant.owner?.email,
                    tenant.owner?.name,
                ].some((value) => value?.toLowerCase().includes(normalizedSearch));
                const matchesPlan = !query.planCode || tenant.subscription?.plan?.code === query.planCode;
                const matchesStatus = !query.status || tenant.subscription?.status === query.status;

                return matchesSearch && matchesPlan && matchesStatus;
            })
            .map((tenant) => this.mapTenant(tenant));
    }

    async getTenant(tenantId: string) {
        const tenant = await this.db.tenant.findUnique({
            where: { id: tenantId },
            include: {
                owner: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
                stores: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        created_at: true,
                    },
                    orderBy: { created_at: 'asc' },
                },
                users: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                            },
                        },
                    },
                },
                subscription: {
                    include: { plan: true },
                },
            },
        });

        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        return this.mapTenant(tenant);
    }

    async updateSubscription(tenantId: string, dto: UpdateAdminTenantSubscriptionDto) {
        const existing = await this.db.tenantSubscription.findUnique({
            where: { tenant_id: tenantId },
            include: { plan: true },
        });

        if (!existing && !dto.planCode) {
            throw new NotFoundException('A plan code is required when creating a subscription.');
        }

        const result = await this.billingService.applySubscriptionChange({
            tenantId,
            planCode: dto.planCode ?? existing!.plan.code,
            billingCycle: dto.billingCycle,
            status: dto.status ?? existing?.status ?? 'ACTIVE',
            periodStart: existing?.current_period_start,
            periodEnd: existing?.current_period_end,
            cancelAtPeriodEnd: dto.cancelAtPeriodEnd ?? existing?.cancel_at_period_end ?? false,
            providerName: existing?.provider_name ?? 'manual',
            providerCustomerRef: existing?.provider_customer_ref ?? `tenant_${tenantId}`,
            providerSubscriptionRef: existing?.provider_subscription_ref ?? `admin_${tenantId}_${Date.now()}`,
        });

        return result;
    }

    private mapTenant(tenant: any) {
        return {
            id: tenant.id,
            name: tenant.name,
            created_at: tenant.created_at,
            owner: tenant.owner
                ? {
                      id: tenant.owner.id,
                      email: tenant.owner.email,
                      name: tenant.owner.name,
                  }
                : null,
            stores: tenant.stores.map((store: any) => ({
                id: store.id,
                name: store.name,
                address: store.address ?? null,
                created_at: store.created_at,
            })),
            users: tenant.users.map((membership: any) => ({
                id: membership.user.id,
                email: membership.user.email,
                name: membership.user.name,
                role: membership.role,
                joined_at: membership.created_at,
            })),
            store_count: tenant.stores.length,
            user_count: tenant.users.length,
            subscription: tenant.subscription
                ? {
                      status: tenant.subscription.status,
                      current_period_start: tenant.subscription.current_period_start,
                      current_period_end: tenant.subscription.current_period_end,
                      cancel_at_period_end: tenant.subscription.cancel_at_period_end,
                      provider_name: tenant.subscription.provider_name,
                      plan: {
                          code: tenant.subscription.plan.code,
                          name: tenant.subscription.plan.name,
                          description: tenant.subscription.plan.description,
                          monthly_price: Number(tenant.subscription.plan.monthly_price),
                          yearly_price: tenant.subscription.plan.yearly_price === null
                              ? null
                              : Number(tenant.subscription.plan.yearly_price),
                      },
                  }
                : null,
        };
    }
}