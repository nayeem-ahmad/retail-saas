import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SegmentsService {
    private readonly logger = new Logger(SegmentsService.name);

    constructor(private db: DatabaseService) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleCron() {
        this.logger.debug('Running Customer Segmentation evaluation');
        const customers = await this.db.customer.findMany();
        
        for (const customer of customers) {
            let segment = 'Regular';
            if (Number(customer.total_spent) > 500) {
                segment = 'VIP';
            }
            
            const lastSale = await this.db.sale.findFirst({
                where: { customer_id: customer.id },
                orderBy: { created_at: 'desc' },
            });
            
            if (lastSale) {
                const daysSince = (new Date().getTime() - lastSale.created_at.getTime()) / (1000 * 3600 * 24);
                if (daysSince > 30 && segment !== 'VIP') {
                    segment = 'At-Risk';
                }
            } else {
                const daysSinceCreated = (new Date().getTime() - customer.created_at.getTime()) / (1000 * 3600 * 24);
                if (daysSinceCreated > 30) segment = 'At-Risk';
            }
            
            if (segment !== customer.segment_category) {
                await this.db.customer.update({
                    where: { id: customer.id },
                    data: { segment_category: segment }
                });
            }
        }
    }
}
