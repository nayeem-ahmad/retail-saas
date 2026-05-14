import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { WarrantyClaimsService } from './warranty-claims.service';
import { WarrantyClaimsController } from './warranty-claims.controller';

@Module({
    imports: [DatabaseModule],
    controllers: [WarrantyClaimsController],
    providers: [WarrantyClaimsService],
})
export class WarrantyClaimsModule {}
