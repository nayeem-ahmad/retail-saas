import { OnModuleInit } from '@nestjs/common';
export declare class AssetsService implements OnModuleInit {
    private supabase;
    onModuleInit(): void;
    uploadFile(file: Express.Multer.File, path: string): Promise<string>;
}
