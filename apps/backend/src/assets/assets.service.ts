import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AssetsService implements OnModuleInit {
    private supabase: SupabaseClient;

    onModuleInit() {
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
        );
    }

    async uploadFile(file: Express.Multer.File, path: string) {
        const { data, error } = await this.supabase.storage
            .from('product-images')
            .upload(path, file.buffer, {
                contentType: file.mimetype,
                upsert: true,
            });

        if (error) {
            throw error;
        }

        const { data: publicUrl } = this.supabase.storage
            .from('product-images')
            .getPublicUrl(path);

        return publicUrl.publicUrl;
    }
}
