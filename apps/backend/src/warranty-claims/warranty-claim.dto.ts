export class CreateWarrantyClaimDto {
    storeId: string;
    serialNumber: string;
    reason: string;
    description?: string;
}

export class UpdateWarrantyClaimStatusDto {
    status: string;
    resolutionNotes?: string;
}
