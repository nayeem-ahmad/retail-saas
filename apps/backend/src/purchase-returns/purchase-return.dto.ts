import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePurchaseReturnItemDto {
    @IsString()
    purchaseItemId: string;

    @IsNumber()
    @Min(1)
    quantity: number;
}

export class CreatePurchaseReturnDto {
    @IsString()
    storeId: string;

    @IsString()
    purchaseId: string;

    @IsArray()
    items: CreatePurchaseReturnItemDto[];

    @IsOptional()
    @IsString()
    referenceNumber?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdatePurchaseReturnItemDto {
    @IsString()
    purchaseItemId: string;

    @IsNumber()
    @Min(1)
    quantity: number;
}

export class UpdatePurchaseReturnDto {
    @IsOptional()
    @IsString()
    referenceNumber?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsArray()
    items?: UpdatePurchaseReturnItemDto[];
}