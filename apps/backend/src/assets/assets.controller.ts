import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantInterceptor } from '../database/tenant.interceptor';
import { Tenant, TenantContext } from '../database/tenant.decorator';

@Controller('assets')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TenantInterceptor)
export class AssetsController {
    constructor(private readonly assetsService: AssetsService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @Tenant() tenant: TenantContext,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const fileName = `${tenant.tenantId}/${Date.now()}-${file.originalname}`;
        const url = await this.assetsService.uploadFile(file, fileName);

        return { url };
    }
}
