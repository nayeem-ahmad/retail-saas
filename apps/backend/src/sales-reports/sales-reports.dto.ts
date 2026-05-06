import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

export class GetSalesSummaryDto {
    @IsOptional()
    @IsUUID()
    storeId?: string;

    @IsOptional()
    @IsString()
    from?: string;

    @IsOptional()
    @IsString()
    to?: string;
}

export class GetSalesByProductDto {
    @IsOptional()
    @IsUUID()
    storeId?: string;

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

export class GetTopCustomersDto {
    @IsOptional()
    @IsUUID()
    customerGroupId?: string;

    @IsOptional()
    @IsUUID()
    territoryId?: string;

    @IsOptional()
    @IsString()
    from?: string;

    @IsOptional()
    @IsString()
    to?: string;

    @IsOptional()
    @IsNumberString()
    limit?: string;
}

export class GetReturnsAnalysisDto {
    @IsOptional()
    @IsUUID()
    storeId?: string;

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
