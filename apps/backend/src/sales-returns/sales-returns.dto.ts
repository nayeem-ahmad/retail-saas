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
