export declare class CreateSaleItemDto {
    productId: string;
    quantity: number;
    priceAtSale: number;
}
export declare class CreateSaleDto {
    storeId: string;
    totalAmount: number;
    amountPaid: number;
    items: CreateSaleItemDto[];
}
