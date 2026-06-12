import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

@Module({
    imports: [DatabaseModule],
    controllers: [ExpensesController],
    providers: [ExpensesService],
})
export class ExpensesModule {}