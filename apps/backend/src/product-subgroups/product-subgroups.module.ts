import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProductSubgroupsController } from './product-subgroups.controller';
import { ProductSubgroupsService } from './product-subgroups.service';

@Module({
    imports: [DatabaseModule],
    controllers: [ProductSubgroupsController],
    providers: [ProductSubgroupsService],
})
export class ProductSubgroupsModule {}