import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SignupDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private db: DatabaseService,
        private jwtService: JwtService,
    ) { }

    async signup(dto: SignupDto) {
        const existingUser = await this.db.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = await this.db.user.create({
            data: {
                email: dto.email,
                passwordHash,
                name: dto.name,
            },
        });

        return this.generateToken(user);
    }

    async login(dto: LoginDto) {
        const user = await this.db.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateToken(user);
    }

    private generateToken(user: any) {
        const payload = { sub: user.id, email: user.email };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        };
    }

    async setupStore(userId: string, dto: { name: string; address?: string }) {
        return this.db.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: dto.name,
                    owner_id: userId,
                },
            });

            await tx.tenantUser.create({
                data: {
                    tenant_id: tenant.id,
                    user_id: userId,
                    role: 'OWNER',
                },
            });

            const store = await tx.store.create({
                data: {
                    tenant_id: tenant.id,
                    name: dto.name,
                    address: dto.address,
                },
            });

            return { tenant, store };
        });
    }
}
