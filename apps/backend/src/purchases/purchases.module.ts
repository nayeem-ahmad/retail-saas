import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';

@Module({
    imports: [DatabaseModule],
    controllers: [PurchasesController],
    providers: [PurchasesService],
})
export class PurchasesModule {}