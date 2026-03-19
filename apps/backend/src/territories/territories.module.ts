import { Module } from '@nestjs/common';
import { TerritoriesController } from './territories.controller';
import { TerritoriesService } from './territories.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [TerritoriesController],
    providers: [TerritoriesService],
})
export class TerritoriesModule {}
