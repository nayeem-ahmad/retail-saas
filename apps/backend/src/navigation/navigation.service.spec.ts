import { BadRequestException } from '@nestjs/common';
import { getDefaultNavLayout, NavScope } from '@erp71/shared-types';
import { NavigationService } from './navigation.service';

describe('NavigationService', () => {
    const platformSettings = {
        getRawValue: jest.fn(),
        upsertSettings: jest.fn(),
    };

    let service: NavigationService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new NavigationService(platformSettings as any);
    });

    it('returns default layout when nothing is stored', async () => {
        platformSettings.getRawValue.mockResolvedValue(null);

        const result = await service.getLayout(NavScope.TENANT);

        expect(result.isDefault).toBe(true);
        expect(result.layout).toEqual(getDefaultNavLayout(NavScope.TENANT));
    });

    it('rejects invalid layout on save', async () => {
        await expect(
            service.saveLayout(NavScope.TENANT, [
                { id: 'unknown-node', parentId: null, sortOrder: 0, visible: true },
            ]),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('persists valid layout updates', async () => {
        const layout = getDefaultNavLayout(NavScope.TENANT);

        await service.saveLayout(NavScope.TENANT, layout, 'admin-user');

        expect(platformSettings.upsertSettings).toHaveBeenCalledWith(
            'navigation',
            expect.objectContaining({ tenant_layout: expect.any(String) }),
            'admin-user',
        );
    });
});