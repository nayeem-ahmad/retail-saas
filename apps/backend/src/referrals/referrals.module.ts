import { Module } from '@nestjs/common';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [ReferralsController],
    providers: [ReferralsService],
    exports: [ReferralsService],
})
export class ReferralsModule {}
