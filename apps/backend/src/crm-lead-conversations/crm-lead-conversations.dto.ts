import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsEnum, IsUUID, IsIn, IsDateString } from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
    value === '' || value === null ? undefined : value;

export enum LeadConversationType {
    CALL = 'CALL',
    SMS = 'SMS',
    WHATSAPP = 'WHATSAPP',
    EMAIL = 'EMAIL',
    VISIT = 'VISIT',
    ONLINE_MEETING = 'ONLINE_MEETING',
    NOTE = 'NOTE',
}

export class CreateLeadConversationDto {
    @IsUUID()
    lead_id: string;

    @IsEnum(LeadConversationType)
    type: LeadConversationType;

    @IsOptional()
    @IsIn(['INBOUND', 'OUTBOUND'])
    direction?: string;

    @IsString()
    summary: string;

    @IsOptional()
    @IsString()
    outcome?: string;

    @IsOptional()
    @IsString()
    store_id?: string;

    @IsOptional()
    @Transform(emptyToUndefined)
    @IsString()
    next_step?: string;

    @IsOptional()
    @Transform(emptyToUndefined)
    @IsDateString()
    next_step_date?: string;

    @IsOptional()
    @Transform(emptyToUndefined)
    @IsUUID()
    next_step_assigned_to?: string;
}

export class UpdateLeadConversationDto {
    @IsOptional()
    @IsEnum(LeadConversationType)
    type?: LeadConversationType;

    @IsOptional()
    @IsString()
    summary?: string;

    @IsOptional()
    @IsString()
    outcome?: string;
}