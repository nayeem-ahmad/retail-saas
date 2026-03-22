import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { StockTakesController } from './stock-takes.controller';
import { StockTakesService } from './stock-takes.service';

@Module({
    imports: [DatabaseModule],
    controllers: [StockTakesController],
    providers: [StockTakesService],
})
export class StockTakesModule {}