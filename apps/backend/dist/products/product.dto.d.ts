export declare class CreateProductDto {
    name: string;
    sku?: string;
    price: number;
    initialStock?: number;
    image_url?: string;
}
export declare class UpdateProductDto {
    name?: string;
    sku?: string;
    price?: number;
}
