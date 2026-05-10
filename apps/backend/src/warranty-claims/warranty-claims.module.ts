import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { WarrantyClaimsController } from './warranty-claims.controller';
import { WarrantyClaimsService } from './warranty-claims.service';

@Module({
    imports: [DatabaseModule],
    controllers: [WarrantyClaimsController],
    providers: [WarrantyClaimsService],
})
export class WarrantyClaimsModule {}
