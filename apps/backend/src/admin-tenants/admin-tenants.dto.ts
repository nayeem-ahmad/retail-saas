import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ListAdminTenantsQueryDto {
    @IsOptional() @IsString() search?: string;
    @IsOptional() @IsString() planCode?: 'FREE' | 'BASIC' | 'STANDARD' | 'PREMIUM';
    @IsOptional() @IsString() status?: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIALING';
}

export class UpdateAdminTenantSubscriptionDto {
    @IsOptional() @IsString() planCode?: 'FREE' | 'BASIC' | 'STANDARD' | 'PREMIUM';
    @IsOptional() @IsString() status?: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIALING';
    @IsOptional() @IsString() billingCycle?: 'MONTHLY' | 'YEARLY';
    @IsOptional() cancelAtPeriodEnd?: boolean;
}

export class SuspendTenantDto {
    @IsOptional() @IsString() reason?: string;
}

export class ListAdminUsersQueryDto {
    @IsOptional() @IsString() search?: string;
    @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
    @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

export class PromoteUserDto {
    @IsString() userId: string;
}