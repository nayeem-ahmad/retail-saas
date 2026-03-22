import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
    imports: [DatabaseModule],
    controllers: [ProductsController],
    providers: [ProductsService],
})
export class ProductsModule { }
