import { AssetsService } from './assets.service';
import { TenantContext } from '../database/tenant.decorator';
export declare class AssetsController {
    private readonly assetsService;
    constructor(assetsService: AssetsService);
    uploadFile(tenant: TenantContext, file: Express.Multer.File): Promise<{
        url: string;
    }>;
}
