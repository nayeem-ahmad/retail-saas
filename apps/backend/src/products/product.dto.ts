import { IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateProductDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    sku?: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    initialStock?: number;

    @IsOptional()
    @IsString()
    image_url?: string;

    @IsOptional()
    @IsUUID()
    groupId?: string;

    @IsOptional()
    @IsUUID()
    subgroupId?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    reorderLevel?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    safetyStock?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    leadTimeDays?: number;
}

export class UpdateProductDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    sku?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @IsOptional()
    @IsString()
    image_url?: string;

    @IsOptional()
    @IsUUID()
    groupId?: string;

    @IsOptional()
    @IsUUID()
    subgroupId?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    reorderLevel?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    safetyStock?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    leadTimeDays?: number;
}
