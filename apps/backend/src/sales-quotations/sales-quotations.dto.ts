import { IsString, IsArray, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateQuotationItemDto {
    @IsString()
    productId: string;

    @IsNumber()
    quantity: number;

    @IsNumber()
    unitPrice: number;
}

export class CreateQuotationDto {
    @IsString()
    storeId: string;

    @IsOptional()
    @IsString()
    customerId?: string;

    @IsArray()
    items: CreateQuotationItemDto[];

    @IsNumber()
    totalAmount: number;

    @IsOptional()
    @IsDateString()
    validUntil?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateQuotationDto {
    @IsOptional()
    @IsString()
    customerId?: string;

    @IsOptional()
    @IsArray()
    items?: CreateQuotationItemDto[];

    @IsOptional()
    @IsNumber()
    totalAmount?: number;

    @IsOptional()
    @IsDateString()
    validUntil?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateQuotationStatusDto {
    @IsString()
    status: string;
}
