import { DatabaseService } from '../database/database.service';
import { JwtService } from '@nestjs/jwt';
import { SignupDto, LoginDto } from './auth.dto';
export declare class AuthService {
    private db;
    private jwtService;
    constructor(db: DatabaseService, jwtService: JwtService);
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
    private generateToken;
    getMe(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        tenants: {
            id: string;
            name: string;
            role: import(".prisma/client").$Enums.UserRole;
            stores: {
                id: string;
                name: string;
                created_at: Date;
                tenant_id: string;
                address: string | null;
            }[];
        }[];
    }>;
    setupStore(userId: string, dto: {
        name: string;
        address?: string;
    }): Promise<{
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
            tenant_id: string;
            address: string | null;
        };
    }>;
}
