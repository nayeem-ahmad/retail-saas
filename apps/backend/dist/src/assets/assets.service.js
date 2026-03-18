"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
let AssetsService = class AssetsService {
    onModuleInit() {
        this.supabase = (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    }
    async uploadFile(file, path) {
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
};
exports.AssetsService = AssetsService;
exports.AssetsService = AssetsService = __decorate([
    (0, common_1.Injectable)()
], AssetsService);
//# sourceMappingURL=assets.service.js.map