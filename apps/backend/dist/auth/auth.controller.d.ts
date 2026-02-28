import { AuthService } from './auth.service';
import { SignupDto, LoginDto, CreateStoreDto } from './auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    signup(dto: SignupDto): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
        };
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
        };
    }>;
    setupStore(req: any, dto: CreateStoreDto): Promise<{
        tenant: {
            id: string;
            name: string;
            created_at: Date;
            owner_id: string;
        };
        store: {
            id: string;
            name: string;
            created_at: Date;
            address: string | null;
            tenant_id: string;
        };
    }>;
}
