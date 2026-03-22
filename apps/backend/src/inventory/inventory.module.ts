import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
    imports: [DatabaseModule],
    controllers: [InventoryController],
    providers: [InventoryService],
})
export class InventoryModule {}