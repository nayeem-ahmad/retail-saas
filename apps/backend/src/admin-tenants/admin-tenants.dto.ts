export class ListAdminTenantsQueryDto {
    search?: string;
    planCode?: 'BASIC' | 'PREMIUM';
    status?: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIALING';
}

export class UpdateAdminTenantSubscriptionDto {
    planCode?: 'BASIC' | 'PREMIUM';
    status?: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIALING';
    billingCycle?: 'MONTHLY' | 'YEARLY';
    cancelAtPeriodEnd?: boolean;
}