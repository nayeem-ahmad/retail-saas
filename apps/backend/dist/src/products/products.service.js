"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let ProductsService = class ProductsService {
    constructor(db) {
        this.db = db;
    }
    async create(tenantId, dto) {
        return this.db.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    tenant_id: tenantId,
                    name: dto.name,
                    sku: dto.sku,
                    price: dto.price,
                    image_url: dto.image_url,
                },
            });
            if (dto.initialStock !== undefined) {
                await tx.productStock.create({
                    data: {
                        tenant_id: tenantId,
                        product_id: product.id,
                        quantity: dto.initialStock,
                    },
                });
            }
            return product;
        });
    }
    async findAll(tenantId) {
        return this.db.product.findMany({
            where: { tenant_id: tenantId },
            include: { stocks: true },
        });
    }
    async findOne(tenantId, id) {
        const product = await this.db.product.findFirst({
            where: { id, tenant_id: tenantId },
            include: { stocks: true },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        return product;
    }
    async update(tenantId, id, dto) {
        return this.db.product.updateMany({
            where: { id, tenant_id: tenantId },
            data: dto,
        });
    }
    async remove(tenantId, id) {
        return this.db.product.deleteMany({
            where: { id, tenant_id: tenantId },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ProductsService);
//# sourceMappingURL=products.service.js.map