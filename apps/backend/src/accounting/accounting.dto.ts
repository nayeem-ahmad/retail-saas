import { Type } from 'class-transformer';
import { AccountCategory, AccountType, VoucherType } from '@retail-saas/shared-types';
import {
    ArrayMinSize,
    IsDateString,
    IsIn,
    IsNotEmpty,
    IsNumber,
    IsInt,
    Min,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

export class CreateAccountGroupDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsIn(Object.values(AccountType))
    type: AccountType;
}

export class CreateAccountSubgroupDto {
    @IsString()
    @IsNotEmpty()
    groupId: string;

    @IsString()
    @IsNotEmpty()
    name: string;
}

export class CreateAccountDto {
    @IsString()
    @IsNotEmpty()
    groupId: string;

    @IsOptional()
    @IsString()
    subgroupId?: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    code?: string;

    @IsString()
    @IsIn(Object.values(AccountType))
    type: AccountType;

    @IsString()
    @IsIn(Object.values(AccountCategory))
    category: AccountCategory;
}

export class ListAccountSubgroupsQueryDto {
    @IsOptional()
    @IsString()
    groupId?: string;
}

export class ListAccountsQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    groupId?: string;

    @IsOptional()
    @IsString()
    @IsIn(Object.values(AccountType))
    type?: AccountType;

    @IsOptional()
    @IsString()
    @IsIn(Object.values(AccountCategory))
    category?: AccountCategory;
}

export class VoucherNumberPreviewQueryDto {
    @IsString()
    @IsIn(Object.values(VoucherType))
    voucherType: VoucherType;
}

export class CreateVoucherDetailDto {
    @IsString()
    @IsNotEmpty()
    accountId: string;

    @Type(() => Number)
    @IsNumber()
    debitAmount: number;

    @Type(() => Number)
    @IsNumber()
    creditAmount: number;

    @IsOptional()
    @IsString()
    comment?: string;
}

export class CreateVoucherDto {
    @IsString()
    @IsIn(Object.values(VoucherType))
    voucherType: VoucherType;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    referenceNumber?: string;

    @IsOptional()
    @IsDateString()
    date?: string;

    @ArrayMinSize(2)
    @ValidateNested({ each: true })
    @Type(() => CreateVoucherDetailDto)
    details: CreateVoucherDetailDto[];
}

export class ListVouchersQueryDto {
    @IsOptional()
    @IsString()
    @IsIn(Object.values(VoucherType))
    voucherType?: VoucherType;

    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number;
}

export class ListLedgerQueryDto {
    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;
}

export class FinancialKpiQueryDto {
    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;
}

export class FinancialTrendQueryDto {
    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;
}