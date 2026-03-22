import { SetMetadata } from '@nestjs/common';

export const SUBSCRIPTION_PLAN_KEY = 'subscription_plan';
export const SUBSCRIPTION_FEATURE_KEY = 'subscription_feature';

export const RequiresPlan = (planCode: 'FREE' | 'BASIC' | 'STANDARD' | 'PREMIUM') =>
	SetMetadata(SUBSCRIPTION_PLAN_KEY, planCode);

export const RequiresFeature = (featureKey: string) =>
	SetMetadata(SUBSCRIPTION_FEATURE_KEY, featureKey);