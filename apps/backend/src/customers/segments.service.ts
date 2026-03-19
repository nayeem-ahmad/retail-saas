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
        this.logger.debug('Running Customer Segmentation evaluation');
        const customers = await this.db.customer.findMany({
            include: { customerGroup: true },
        });
        
        for (const customer of customers) {
            let segment = 'Regular';

            // VIP: lifetime spent > ৳50,000 BDT
            if (Number(customer.total_spent) > VIP_THRESHOLD_BDT) {
                segment = 'VIP';
            }
            
            // At-Risk: no purchase in > 30 days (only if not already VIP)
            const lastSale = await this.db.sale.findFirst({
                where: { customer_id: customer.id },
                orderBy: { created_at: 'desc' },
            });
            
            if (lastSale) {
                const daysSince = (new Date().getTime() - lastSale.created_at.getTime()) / (1000 * 3600 * 24);
                if (daysSince > AT_RISK_DAYS && segment !== 'VIP') {
                    segment = 'At-Risk';
                }
            } else {
                const daysSinceCreated = (new Date().getTime() - customer.created_at.getTime()) / (1000 * 3600 * 24);
                if (daysSinceCreated > AT_RISK_DAYS && segment !== 'VIP') {
                    segment = 'At-Risk';
                }
            }
            
            if (segment !== customer.segment_category) {
                await this.db.customer.update({
                    where: { id: customer.id },
                    data: { segment_category: segment }
                });
            }
        }

        this.logger.debug('Segmentation evaluation complete');
    }
}
