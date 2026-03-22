import { IsOptional, IsString, IsUUID } from 'class-validator';

export class GetReorderSuggestionsDto {
    @IsOptional()
    @IsUUID()
    warehouseId?: string;

    @IsOptional()
    @IsUUID()
    groupId?: string;

    @IsOptional()
    @IsUUID()
    subgroupId?: string;
}

export class GetInventoryValuationDto {
    @IsOptional()
    @IsUUID()
    warehouseId?: string;

    @IsOptional()
    @IsUUID()
    groupId?: string;

    @IsOptional()
    @IsUUID()
    subgroupId?: string;
}

export class GetShrinkageSummaryDto {
    @IsOptional()
    @IsUUID()
    warehouseId?: string;

    @IsOptional()
    @IsUUID()
    reasonId?: string;

    @IsOptional()
    @IsUUID()
    productId?: string;

    @IsOptional()
    @IsUUID()
    groupId?: string;

    @IsOptional()
    @IsUUID()
    subgroupId?: string;

    @IsOptional()
    @IsString()
    from?: string;

    @IsOptional()
    @IsString()
    to?: string;
}