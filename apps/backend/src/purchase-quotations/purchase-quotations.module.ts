import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PurchaseQuotationsController } from './purchase-quotations.controller';
import { PurchaseQuotationsService } from './purchase-quotations.service';

@Module({
    imports: [DatabaseModule],
    controllers: [PurchaseQuotationsController],
    providers: [PurchaseQuotationsService],
})
export class PurchaseQuotationsModule {}
