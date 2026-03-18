import { Module } from '@nestjs/common';
import { SalesReturnsController } from './sales-returns.controller';
import { SalesReturnsService } from './sales-returns.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [SalesReturnsController],
    providers: [SalesReturnsService],
})
export class SalesReturnsModule {}
