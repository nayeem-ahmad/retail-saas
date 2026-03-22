import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InventoryShrinkageController } from './inventory-shrinkage.controller';
import { InventoryShrinkageService } from './inventory-shrinkage.service';

@Module({
    imports: [DatabaseModule],
    controllers: [InventoryShrinkageController],
    providers: [InventoryShrinkageService],
})
export class InventoryShrinkageModule {}