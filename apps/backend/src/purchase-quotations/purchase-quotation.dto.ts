import { IsString, IsArray, IsNumber, IsOptional, IsDateString, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseQuotationItemDto {
    @IsString()
    productId: string;

    @IsNumber()
    quantity: number;

    @IsNumber()
    unitCost: number;
}

export class CreatePurchaseQuotationDto {
    @IsString()
    storeId: string;

    @IsOptional()
    @IsString()
    supplierId?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePurchaseQuotationItemDto)
    items: CreatePurchaseQuotationItemDto[];

    @IsOptional()
    @IsDateString()
    validUntil?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdatePurchaseQuotationStatusDto {
    @IsString()
    @IsIn(['DRAFT', 'SENT', 'RECEIVED', 'ACCEPTED', 'REJECTED', 'CONVERTED', 'CANCELLED'])
    status: string;
}
