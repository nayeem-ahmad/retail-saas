import { BadRequestException, Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { JwtService } from '@nestjs/jwt';
import { bootstrapDefaultAccountingForTenant } from '@retail-saas/database';
import * as bcrypt from 'bcrypt';
import { SignupDto, LoginDto } from './auth.dto';
import { isPlatformAdminEmail } from './platform-admin.util';

@Injectable()
export class AuthService {
    constructor(
        private db: DatabaseService,
        private jwtService: JwtService,
    ) { }

    async signup(dto: SignupDto) {
        const existingUser = await this.db.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = await this.db.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
                data: {
                    email: dto.email,
                    passwordHash,
                    name: dto.name,
                },
            });

            await this.provisionTenant(tx, createdUser.id, {
                tenantName: dto.tenantName,
                storeName: dto.storeName,
                address: dto.address,
                planCode: dto.planCode,
            });

            return createdUser;
        });

        return this.generateAuthResponse(user.id);
    }

    async login(dto: LoginDto) {
        const user = await this.db.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateAuthResponse(user.id);
    }

    async getPlans() {
        const plans = await this.db.subscriptionPlan.findMany({
            where: { is_active: true },
            orderBy: { monthly_price: 'asc' },
        });

        return plans.map((plan) => ({
            code: plan.code,
            name: plan.name,
            description: plan.description,
            monthly_price: Number(plan.monthly_price),
            yearly_price: plan.yearly_price === null ? null : Number(plan.yearly_price),
            features_json: plan.features_json,
        }));
    }

    private async generateAuthResponse(userId: string) {
        const user = await this.db.user.findUnique({
            where: { id: userId },
            include: {
                tenantMembers: {
                    include: {
                        tenant: {
                            include: {
                                stores: true,
                                subscription: {
                                    include: { plan: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const payload = { sub: user.id, email: user.email };
        const isPlatformAdmin = isPlatformAdminEmail(user.email);
        return {
            access_token: this.jwtService.sign(payload),
            is_platform_admin: isPlatformAdmin,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                is_platform_admin: isPlatformAdmin,
            },
            tenants: user.tenantMembers.map((membership) => this.mapTenantMembership(membership)),
        };
    }

    async getMe(userId: string) {
        const user = await this.db.user.findUnique({
            where: { id: userId },
            include: {
                tenantMembers: {
                    include: {
                        tenant: {
                            include: {
                                stores: true,
                                subscription: {
                                    include: { plan: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            is_platform_admin: isPlatformAdminEmail(user.email),
            tenants: user.tenantMembers.map((membership) => this.mapTenantMembership(membership)),
        };
    }

    async setupStore(userId: string, dto: { name: string; address?: string }) {
        return this.db.$transaction(async (tx) =>
            this.provisionTenant(tx, userId, {
                tenantName: dto.name,
                storeName: dto.name,
                address: dto.address,
                planCode: 'BASIC',
            }),
        );
    }

    async setupTenant(userId: string, dto: { tenantName: string; storeName: string; address?: string; planCode?: 'BASIC' | 'PREMIUM' }) {
        return this.db.$transaction(async (tx) =>
            this.provisionTenant(tx, userId, {
                tenantName: dto.tenantName,
                storeName: dto.storeName,
                address: dto.address,
                planCode: dto.planCode,
            }),
        );
    }

    private async provisionTenant(
        tx: any,
        userId: string,
        dto: { tenantName: string; storeName: string; address?: string; planCode?: 'BASIC' | 'PREMIUM' },
    ) {
        const planCode = dto.planCode ?? 'BASIC';
        const plan = await tx.subscriptionPlan.findUnique({
            where: { code: planCode },
        });

        if (!plan || !plan.is_active) {
            throw new BadRequestException('Selected subscription plan is not available.');
        }

        const tenant = await tx.tenant.create({
            data: {
                name: dto.tenantName,
                owner_id: userId,
            },
        });

        await tx.tenantUser.create({
            data: {
                tenant_id: tenant.id,
                user_id: userId,
                role: 'OWNER',
            },
        });

        const store = await tx.store.create({
            data: {
                tenant_id: tenant.id,
                name: dto.storeName,
                address: dto.address,
            },
        });

        await tx.tenantSubscription.create({
            data: {
                tenant_id: tenant.id,
                plan_id: plan.id,
                status: 'TRIALING',
                current_period_start: new Date(),
                current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                provider_name: 'manual',
            },
        });

        await bootstrapDefaultAccountingForTenant(tx, tenant.id);

        return { tenant, store };
    }

    private mapTenantMembership(membership: any) {
        const subscription = membership.tenant.subscription;
        const plan = subscription?.plan;

        return {
            id: membership.tenant.id,
            name: membership.tenant.name,
            role: membership.role,
            stores: membership.tenant.stores,
            subscription: subscription
                ? {
                      status: subscription.status,
                      current_period_start: subscription.current_period_start,
                      current_period_end: subscription.current_period_end,
                      cancel_at_period_end: subscription.cancel_at_period_end,
                      is_premium: plan?.code === 'PREMIUM',
                      plan: plan
                          ? {
                                code: plan.code,
                                name: plan.name,
                                description: plan.description,
                                monthly_price: Number(plan.monthly_price),
                                yearly_price: plan.yearly_price === null ? null : Number(plan.yearly_price),
                                features_json: plan.features_json,
                            }
                          : null,
                  }
                : null,
        };
    }
}
