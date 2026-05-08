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
        await this.runForTenant(null);
        this.logger.debug('Segmentation evaluation complete');
    }

    async runForTenant(tenantId: string | null): Promise<{ updated: number; total: number }> {
        const where = tenantId ? { tenant_id: tenantId } : {};
        const customers = await this.db.customer.findMany({ where });

        let updated = 0;

        for (const customer of customers) {
            let segment = 'Regular';

            if (Number(customer.total_spent) > VIP_THRESHOLD_BDT) {
                segment = 'VIP';
            }

            const lastSale = await this.db.sale.findFirst({
                where: { customer_id: customer.id },
                orderBy: { created_at: 'desc' },
            });

            if (lastSale) {
                const daysSince = (Date.now() - lastSale.created_at.getTime()) / (1000 * 3600 * 24);
                if (daysSince > AT_RISK_DAYS && segment !== 'VIP') {
                    segment = 'At-Risk';
                }
            } else {
                const daysSinceCreated = (Date.now() - customer.created_at.getTime()) / (1000 * 3600 * 24);
                if (daysSinceCreated > AT_RISK_DAYS && segment !== 'VIP') {
                    segment = 'At-Risk';
                }
            }

            if (segment !== customer.segment_category) {
                await this.db.customer.update({
                    where: { id: customer.id },
                    data: { segment_category: segment },
                });
                updated++;
            }
        }

        return { updated, total: customers.length };
    }
}
