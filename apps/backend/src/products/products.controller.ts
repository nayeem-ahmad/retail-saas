import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantInterceptor } from '../database/tenant.interceptor';
import { Tenant, TenantContext } from '../database/tenant.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    create(@Tenant() tenant: TenantContext, @Body() dto: CreateProductDto) {
        return this.productsService.create(tenant.tenantId, dto);
    }

    @Get()
    findAll(@Tenant() tenant: TenantContext) {
        return this.productsService.findAll(tenant.tenantId);
    }

    @Get(':id')
    findOne(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.productsService.findOne(tenant.tenantId, id);
    }

    @Patch(':id')
    update(
        @Tenant() tenant: TenantContext,
        @Param('id') id: string,
        @Body() dto: UpdateProductDto,
    ) {
        return this.productsService.update(tenant.tenantId, id, dto);
    }

    @Delete(':id')
    remove(@Tenant() tenant: TenantContext, @Param('id') id: string) {
        return this.productsService.remove(tenant.tenantId, id);
    }
}
