import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class CreateInventoryShrinkageItemDto {
    @IsUUID()
    productId: string;

    @IsInt()
    @Min(1)
    quantity: number;

    @IsOptional()
    @IsString()
    note?: string;
}

export class CreateInventoryShrinkageDto {
    @IsUUID()
    warehouseId: string;

    @IsUUID()
    reasonId: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateInventoryShrinkageItemDto)
    items: CreateInventoryShrinkageItemDto[];
}