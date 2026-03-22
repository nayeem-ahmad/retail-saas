import { IsOptional, IsString } from 'class-validator';

export class CreateProductGroupDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateProductGroupDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;
}