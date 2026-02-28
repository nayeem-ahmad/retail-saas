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
            address: string | null;
            tenant_id: string;
        };
    }>;
}
