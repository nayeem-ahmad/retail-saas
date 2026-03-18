import { Module } from '@nestjs/common';
import { SalesQuotationsController } from './sales-quotations.controller';
import { SalesQuotationsService } from './sales-quotations.service';
import { DatabaseModule } from '../database/database.module';
import { SalesOrdersModule } from '../sales-orders/sales-orders.module';

@Module({
    imports: [DatabaseModule, SalesOrdersModule],
    controllers: [SalesQuotationsController],
    providers: [SalesQuotationsService],
})
export class SalesQuotationsModule {}
