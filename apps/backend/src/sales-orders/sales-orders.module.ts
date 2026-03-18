import { Module } from '@nestjs/common';
import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrdersService } from './sales-orders.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [SalesOrdersController],
    providers: [SalesOrdersService],
    exports: [SalesOrdersService]
})
export class SalesOrdersModule {}
