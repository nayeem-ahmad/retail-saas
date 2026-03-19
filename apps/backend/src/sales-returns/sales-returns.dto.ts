import { IsString, IsArray, IsNumber, IsOptional } from 'class-validator';

export class CreateReturnItemDto {
    @IsString()
    saleItemId: string;

    @IsNumber()
    quantity: number;
}

export class CreateSalesReturnDto {
    @IsString()
    storeId: string;

    @IsString()
    saleId: string;

    @IsArray()
    items: CreateReturnItemDto[];

    @IsOptional()
    @IsString()
    reason?: string;
}

export class UpdateReturnItemDto {
    @IsString()
    saleItemId: string;

    @IsString()
    productId: string;

    @IsNumber()
    quantity: number;
}

export class UpdateSalesReturnDto {
    @IsOptional()
    @IsString()
    reason?: string;

    @IsOptional()
    @IsArray()
    items?: UpdateReturnItemDto[];
}
