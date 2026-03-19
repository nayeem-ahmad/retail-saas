import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateTerritoryDto, UpdateTerritoryDto } from './territory.dto';

@Injectable()
export class TerritoriesService {
    constructor(private db: DatabaseService) {}

    async create(tenantId: string, dto: CreateTerritoryDto) {
        const existing = await this.db.territory.findFirst({
            where: {
                tenant_id: tenantId,
                name: dto.name,
                parent_id: dto.parent_id ?? null,
            },
        });
        if (existing) {
            throw new BadRequestException('A territory with this name already exists under the same parent.');
        }

        if (dto.parent_id) {
            const parent = await this.db.territory.findFirst({
                where: { id: dto.parent_id, tenant_id: tenantId },
            });
            if (!parent) throw new BadRequestException('Parent territory not found.');
        }

        return this.db.territory.create({
            data: { tenant_id: tenantId, ...dto },
        });
    }

    async findAll(tenantId: string) {
        return this.db.territory.findMany({
            where: { tenant_id: tenantId },
            include: {
                parent: { select: { id: true, name: true } },
                _count: { select: { customers: true, children: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(tenantId: string, id: string) {
        const territory = await this.db.territory.findFirst({
            where: { id, tenant_id: tenantId },
            include: {
                parent: { select: { id: true, name: true } },
                _count: { select: { customers: true, children: true } },
            },
        });
        if (!territory) throw new NotFoundException('Territory not found');
        return territory;
    }

    async update(tenantId: string, id: string, dto: UpdateTerritoryDto) {
        await this.findOne(tenantId, id);

        if (dto.name) {
            const duplicate = await this.db.territory.findFirst({
                where: {
                    tenant_id: tenantId,
                    name: dto.name,
                    parent_id: dto.parent_id ?? null,
                    NOT: { id },
                },
            });
            if (duplicate) {
                throw new BadRequestException('A territory with this name already exists under the same parent.');
            }
        }

        return this.db.territory.update({
            where: { id },
            data: dto,
        });
    }

    async remove(tenantId: string, id: string) {
        const territory = await this.findOne(tenantId, id);
        const counts = (territory as any)._count;
        if (counts.customers > 0 || counts.children > 0) {
            throw new BadRequestException(
                'Cannot delete this territory — it has associated customers or child territories.',
            );
        }
        return this.db.territory.delete({ where: { id } });
    }
}
