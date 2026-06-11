import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { CrmCampaignsModule } from '../crm-campaigns/crm-campaigns.module';

@Module({
    imports: [DatabaseModule, CrmCampaignsModule],
    controllers: [SalesController],
    providers: [SalesService],
})
export class SalesModule { }
