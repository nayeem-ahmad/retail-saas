export class CreateCheckoutSessionDto {
    planCode!: 'BASIC' | 'PREMIUM';
    billingCycle?: 'MONTHLY' | 'YEARLY';
}

export class ConfirmCheckoutDto {
    planCode!: 'BASIC' | 'PREMIUM';
    billingCycle?: 'MONTHLY' | 'YEARLY';
    reference?: string;
}

export class BillingCallbackDto {
    tran_id?: string;
    val_id?: string;
    status?: string;
    amount?: string;
    currency?: string;
    value_a?: string;
    value_b?: string;
    value_c?: string;
    value_d?: string;
}

export class ManualBillingWebhookDto {
    tenantId!: string;
    planCode!: 'BASIC' | 'PREMIUM';
    status?: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIALING';
    billingCycle?: 'MONTHLY' | 'YEARLY';
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
    providerName?: string;
    providerCustomerRef?: string;
    providerSubscriptionRef?: string;
}