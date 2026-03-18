import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCustomerDto } from './customer.dto';

@Injectable()
export class CustomersService {
    constructor(private db: DatabaseService) {}

    async create(tenantId: string, dto: CreateCustomerDto) {
        // Unique constraint check
        const existing = await this.db.customer.findUnique({
            where: {
                tenant_id_phone: {
                    tenant_id: tenantId,
                    phone: dto.phone,
                }
            }
        });

        if (existing) {
            throw new BadRequestException('A customer with this phone number already exists.');
        }

        return this.db.customer.create({
            data: {
                tenant_id: tenantId,
                ...dto
            }
        });
    }

    async findAll(tenantId: string) {
        return this.db.customer.findMany({
            where: { tenant_id: tenantId },
            orderBy: { created_at: 'desc' }
        });
    }

    async findOne(tenantId: string, id: string) {
        const customer = await this.db.customer.findFirst({
            where: { id, tenant_id: tenantId },
            include: {
                sales: {
                    include: { items: { include: { product: true } } },
                    orderBy: { created_at: 'desc' }
                }
            }
        });
        
        if (!customer) throw new BadRequestException('Customer not found');
        return customer;
    }
}
