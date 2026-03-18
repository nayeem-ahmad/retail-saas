import { Module } from '@nestjs/common';
import { CashierSessionsService } from './cashier-sessions.service';
import { CashierSessionsController } from './cashier-sessions.controller';

@Module({
  controllers: [CashierSessionsController],
  providers: [CashierSessionsService],
})
export class CashierSessionsModule {}