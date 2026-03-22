export class CreateCheckoutSessionDto {
    planCode!: 'FREE' | 'BASIC' | 'STANDARD' | 'PREMIUM';
    billingCycle?: 'MONTHLY' | 'YEARLY';
}

export class ConfirmCheckoutDto {
    planCode!: 'FREE' | 'BASIC' | 'STANDARD' | 'PREMIUM';
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
    planCode!: 'FREE' | 'BASIC' | 'STANDARD' | 'PREMIUM';
    status?: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIALING';
    billingCycle?: 'MONTHLY' | 'YEARLY';
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
    providerName?: string;
    providerCustomerRef?: string;
    providerSubscriptionRef?: string;
}