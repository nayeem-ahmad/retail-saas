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
exports.TenantInterceptor = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let TenantInterceptor = class TenantInterceptor {
    constructor(db) {
        this.db = db;
    }
    async intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.userId;
        if (!userId) {
            return next.handle();
        }
        const tenantId = request.headers['x-tenant-id'];
        const storeId = request.headers['x-store-id'];
        if (tenantId) {
            const membership = await this.db.tenantUser.findUnique({
                where: {
                    tenant_id_user_id: {
                        tenant_id: tenantId,
                        user_id: userId,
                    },
                },
            });
            if (!membership) {
                throw new common_1.UnauthorizedException('Invalid tenant context');
            }
            request.tenantId = tenantId;
        }
        if (storeId) {
            request.storeId = storeId;
        }
        return next.handle();
    }
};
exports.TenantInterceptor = TenantInterceptor;
exports.TenantInterceptor = TenantInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], TenantInterceptor);
//# sourceMappingURL=tenant.interceptor.js.map