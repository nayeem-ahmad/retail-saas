import { SetMetadata } from '@nestjs/common';

export const SUBSCRIPTION_PLAN_KEY = 'subscription_plan';

export const RequiresPlan = (planCode: 'BASIC' | 'PREMIUM') => SetMetadata(SUBSCRIPTION_PLAN_KEY, planCode);