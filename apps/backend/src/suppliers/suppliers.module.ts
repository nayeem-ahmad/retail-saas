import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

@Module({
    imports: [DatabaseModule],
    controllers: [SuppliersController],
    providers: [SuppliersService],
    exports: [SuppliersService],
})
export class SuppliersModule {}