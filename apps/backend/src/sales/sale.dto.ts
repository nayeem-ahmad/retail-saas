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
    customerId?: string;
    totalAmount: number;
    amountPaid: number;
    items: CreateSaleItemDto[];
    payments?: CreatePaymentDto[];
}
