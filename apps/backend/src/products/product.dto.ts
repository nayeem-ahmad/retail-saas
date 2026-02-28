export class CreateProductDto {
    name: string;
    sku?: string;
    price: number;
    initialStock?: number;
    image_url?: string;
}

export class UpdateProductDto {
    name?: string;
    sku?: string;
    price?: number;
}
