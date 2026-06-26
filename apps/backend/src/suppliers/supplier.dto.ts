import { IsDateString, IsEmail, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PaginationDto } from '../common/pagination.dto';

export class CreateSupplierDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    address?: string;
}

export class UpdateSupplierDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    address?: string;
}

export enum SupplierPaymentDirectionDto {
    PAY = 'pay',
    RECEIVE = 'receive',
}

export class RecordSupplierCreditPaymentDto {
    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsOptional()
    @IsEnum(SupplierPaymentDirectionDto)
    direction?: SupplierPaymentDirectionDto;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateSupplierCreditPaymentDto {
    @IsOptional()
    @IsNumber()
    @Min(0.01)
    amount?: number;

    @IsOptional()
    @IsEnum(SupplierPaymentDirectionDto)
    direction?: SupplierPaymentDirectionDto;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class ListSupplierCreditPaymentsQueryDto extends PaginationDto {
    @IsOptional()
    @IsUUID()
    supplierId?: string;

    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;

    @IsOptional()
    @IsString()
    search?: string;
}

export class SupplierCreditLedgerQueryDto extends PaginationDto {
    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;
}