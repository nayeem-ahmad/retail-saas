import { BadRequestException } from '@nestjs/common';

export interface SaleLoyaltyPreview {
    loyaltyDiscount: number;
    pointsRedeemed: number;
}

export interface SaleLoyaltyResult extends SaleLoyaltyPreview {
    pointsEarned: number;
}

export async function previewSaleLoyaltyRedemption(
    tx: any,
    tenantId: string,
    customerId: string,
    payableTotal: number,
    pointsToRedeem?: number,
): Promise<SaleLoyaltyPreview> {
    if (!pointsToRedeem || pointsToRedeem <= 0) {
        return { loyaltyDiscount: 0, pointsRedeemed: 0 };
    }

    const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: {
            loyalty_points_enabled: true,
            loyalty_redeem_rate: true,
            loyalty_min_redeem: true,
        },
    });

    if (!tenant?.loyalty_points_enabled || !tenant.loyalty_redeem_rate) {
        throw new BadRequestException('Loyalty redemption is not enabled');
    }

    const customer = await tx.customer.findFirst({
        where: { id: customerId, tenant_id: tenantId, deleted_at: null },
        select: { loyalty_points: true },
    });
    if (!customer) throw new BadRequestException('Customer not found');

    const minRedeem = tenant.loyalty_min_redeem ?? 0;
    const requested = Math.min(pointsToRedeem, customer.loyalty_points);
    if (requested < minRedeem) {
        throw new BadRequestException(`Minimum redemption is ${minRedeem} points`);
    }

    const redeemRate = Number(tenant.loyalty_redeem_rate);
    const rawDiscount = requested * redeemRate;
    const loyaltyDiscount = Math.min(rawDiscount, payableTotal);
    const pointsRedeemed = loyaltyDiscount < rawDiscount
        ? Math.ceil(loyaltyDiscount / redeemRate)
        : requested;

    return { loyaltyDiscount, pointsRedeemed };
}

export async function recordSaleLoyalty(
    tx: any,
    tenantId: string,
    customerId: string,
    saleId: string,
    payableTotal: number,
    preview: SaleLoyaltyPreview = { loyaltyDiscount: 0, pointsRedeemed: 0 },
): Promise<SaleLoyaltyResult> {

    let amountAfterRedeem = payableTotal - preview.loyaltyDiscount;

    if (preview.pointsRedeemed > 0) {
        await tx.loyaltyTransaction.create({
            data: {
                tenantId,
                customerId,
                saleId,
                type: 'REDEEM',
                points: -preview.pointsRedeemed,
                description: `Redeemed ${preview.pointsRedeemed} points for ৳${preview.loyaltyDiscount.toFixed(2)} discount (POS)`,
            },
        });
        await tx.customer.update({
            where: { id: customerId },
            data: { loyalty_points: { decrement: preview.pointsRedeemed } },
        });
    }

    const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: { loyalty_points_enabled: true, loyalty_earn_rate: true },
    });

    let pointsEarned = 0;
    if (tenant?.loyalty_points_enabled && tenant.loyalty_earn_rate) {
        const earnRate = Number(tenant.loyalty_earn_rate);
        pointsEarned = Math.floor(amountAfterRedeem * earnRate);
        if (pointsEarned > 0) {
            await tx.loyaltyTransaction.create({
                data: {
                    tenantId,
                    customerId,
                    saleId,
                    type: 'EARN',
                    points: pointsEarned,
                    description: `Earned from POS sale of ৳${amountAfterRedeem.toFixed(2)}`,
                },
            });
            await tx.customer.update({
                where: { id: customerId },
                data: { loyalty_points: { increment: pointsEarned } },
            });
        }
    }

    return { ...preview, pointsEarned };
}