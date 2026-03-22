import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { WarehouseTransfersController } from './warehouse-transfers.controller';
import { WarehouseTransfersService } from './warehouse-transfers.service';

@Module({
    imports: [DatabaseModule],
    controllers: [WarehouseTransfersController],
    providers: [WarehouseTransfersService],
})
export class WarehouseTransfersModule {}