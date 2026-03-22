import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class CreateStockTakeSessionDto {
    @IsUUID()
    warehouseId: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsBoolean()
    startImmediately?: boolean;
}

export class UpdateStockTakeCountLineDto {
    @IsUUID()
    productId: string;

    @IsInt()
    @Min(0)
    countedQuantity: number;

    @IsOptional()
    @IsUUID()
    reasonId?: string;

    @IsOptional()
    @IsString()
    note?: string;
}

export class UpdateStockTakeCountsDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => UpdateStockTakeCountLineDto)
    lines: UpdateStockTakeCountLineDto[];
}

export class UpdateStockTakeStatusDto {
    @IsString()
    status: 'DRAFT' | 'COUNTING' | 'REVIEW' | 'POSTED' | 'CANCELLED';
}