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
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let SalesService = class SalesService {
    constructor(db) {
        this.db = db;
    }
    async create(tenantId, dto) {
        return this.db.$transaction(async (tx) => {
            const serialNumber = `SL-${Date.now()}`;
            const sale = await tx.sale.create({
                data: {
                    tenant_id: tenantId,
                    store_id: dto.storeId,
                    serial_number: serialNumber,
                    total_amount: dto.totalAmount,
                    amount_paid: dto.amountPaid,
                    status: 'COMPLETED',
                },
            });
            for (const item of dto.items) {
                await tx.saleItem.create({
                    data: {
                        sale_id: sale.id,
                        product_id: item.productId,
                        quantity: item.quantity,
                        price_at_sale: item.priceAtSale,
                    },
                });
                const stock = await tx.productStock.findUnique({
                    where: { product_id: item.productId },
                });
                if (!stock || stock.quantity < item.quantity) {
                    throw new common_1.BadRequestException(`Insufficient stock for product ${item.productId}`);
                }
                await tx.productStock.update({
                    where: { product_id: item.productId },
                    data: {
                        quantity: {
                            decrement: item.quantity,
                        },
                    },
                });
            }
            return sale;
        });
    }
    async findAll(tenantId) {
        return this.db.sale.findMany({
            where: { tenant_id: tenantId },
            include: { items: { include: { product: true } } },
            orderBy: { created_at: 'desc' },
        });
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], SalesService);
//# sourceMappingURL=sales.service.js.map