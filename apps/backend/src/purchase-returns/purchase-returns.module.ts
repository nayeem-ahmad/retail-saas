import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PurchaseReturnsController } from './purchase-returns.controller';
import { PurchaseReturnsService } from './purchase-returns.service';

@Module({
    imports: [DatabaseModule],
    controllers: [PurchaseReturnsController],
    providers: [PurchaseReturnsService],
})
export class PurchaseReturnsModule {}