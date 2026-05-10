import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';

const VIP_THRESHOLD_BDT = 50000;
const AT_RISK_DAYS = 30;

@Injectable()
export class SegmentsService {
    private readonly logger = new Logger(SegmentsService.name);

    constructor(private db: DatabaseService) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleCron() {
        this.logger.debug('Running Customer Segmentation evaluation (all tenants)');
        const tenants = await this.db.tenant.findMany({ select: { id: true } });
        for (const tenant of tenants) {
            await this.evaluateForTenant(tenant.id);
        }
        this.logger.debug('Segmentation evaluation complete');
    }

    async evaluateForTenant(tenantId: string): Promise<{ updated: number }> {
        const customers = await this.db.customer.findMany({
            where: { tenant_id: tenantId },
        });

        let updated = 0;

        for (const customer of customers) {
            const segment = await this.classifyCustomer(customer);
            if (segment !== customer.segment_category) {
                await this.db.customer.update({
                    where: { id: customer.id },
                    data: { segment_category: segment },
                });
                updated++;
            }
        }

        return { updated };
    }

    private async classifyCustomer(customer: { id: string; total_spent: any; created_at: Date; segment_category: string }): Promise<string> {
        if (Number(customer.total_spent) > VIP_THRESHOLD_BDT) {
            return 'VIP';
        }

        const lastSale = await this.db.sale.findFirst({
            where: { customer_id: customer.id },
            orderBy: { created_at: 'desc' },
            select: { created_at: true },
        });

        const referenceDate = lastSale ? lastSale.created_at : customer.created_at;
        const daysSince = (Date.now() - referenceDate.getTime()) / (1000 * 3600 * 24);

        if (daysSince > AT_RISK_DAYS) {
            return 'At-Risk';
        }

        return 'Regular';
    }
}
