import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class NavLayoutNodeDto {
    id!: string;
    parentId!: string | null;
    sortOrder!: number;
    visible!: boolean;
}

export class SaveNavLayoutDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => NavLayoutNodeDto)
    layout!: NavLayoutNodeDto[];
}