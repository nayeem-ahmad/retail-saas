export class CreateSaleItemDto {
    productId: string;
    quantity: number;
    priceAtSale: number;
}

export class CreatePaymentDto {
    paymentMethod: string;
    amount: number;
}

export class CreateSaleDto {
    storeId: string;
    warehouseId?: string;
    customerId?: string;
    totalAmount: number;
    amountPaid: number;
    items: CreateSaleItemDto[];
    payments?: CreatePaymentDto[];
    note?: string;
}

export class UpdateSaleItemDto {
    productId: string;
    quantity: number;
    priceAtSale: number;
}

export class UpdatePaymentDto {
    paymentMethod: string;
    amount: number;
}

export class UpdateSaleDto {
    customerId?: string | null;
    status?: string;
    note?: string;
    items?: UpdateSaleItemDto[];
    payments?: UpdatePaymentDto[];
}
