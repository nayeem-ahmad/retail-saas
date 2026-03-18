import { IsString, IsOptional, IsEmail, Matches } from 'class-validator';

export class CreateCustomerDto {
    @IsString()
    name: string;

    @IsString()
    @Matches(/^\+?[0-9\s\-]+$/, { message: 'Invalid phone number format' })
    phone: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    address?: string;
}
