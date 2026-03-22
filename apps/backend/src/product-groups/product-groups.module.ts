import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProductGroupsController } from './product-groups.controller';
import { ProductGroupsService } from './product-groups.service';

@Module({
    imports: [DatabaseModule],
    controllers: [ProductGroupsController],
    providers: [ProductGroupsService],
})
export class ProductGroupsModule {}