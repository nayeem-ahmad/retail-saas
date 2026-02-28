export class CreateSaleItemDto {
    productId: string;
    quantity: number;
    priceAtSale: number;
}

export class CreateSaleDto {
    storeId: string;
    totalAmount: number;
    amountPaid: number;
    items: CreateSaleItemDto[];
}
