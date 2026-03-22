import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class WarehouseTransferItemDto {
    @IsUUID()
    productId: string;

    @IsInt()
    @Min(1)
    quantity: number;

    @IsOptional()
    @IsString()
    note?: string;
}

export class CreateWarehouseTransferDto {
    @IsUUID()
    sourceWarehouseId: string;

    @IsUUID()
    destinationWarehouseId: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => WarehouseTransferItemDto)
    items: WarehouseTransferItemDto[];

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    status?: 'DRAFT' | 'SENT';
}

export class ReceiveWarehouseTransferItemDto {
    @IsUUID()
    productId: string;

    @IsInt()
    @Min(1)
    quantityReceived: number;

    @IsOptional()
    @IsString()
    note?: string;
}

export class ReceiveWarehouseTransferDto {
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ReceiveWarehouseTransferItemDto)
    items: ReceiveWarehouseTransferItemDto[];
}

export class ListWarehouseTransfersQueryDto {
    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsUUID()
    sourceWarehouseId?: string;

    @IsOptional()
    @IsUUID()
    destinationWarehouseId?: string;

    @IsOptional()
    @IsUUID()
    productId?: string;

    @IsOptional()
    @IsString()
    from?: string;

    @IsOptional()
    @IsString()
    to?: string;
}