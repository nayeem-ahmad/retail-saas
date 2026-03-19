import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateTerritoryDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsUUID()
    parent_id?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateTerritoryDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsUUID()
    parent_id?: string;

    @IsOptional()
    @IsString()
    description?: string;
}
