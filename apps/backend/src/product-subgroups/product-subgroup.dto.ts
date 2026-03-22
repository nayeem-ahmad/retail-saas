import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProductSubgroupDto {
    @IsUUID()
    groupId: string;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateProductSubgroupDto {
    @IsOptional()
    @IsUUID()
    groupId?: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;
}