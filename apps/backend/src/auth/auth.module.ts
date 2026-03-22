import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PlatformAdminGuard } from './platform-admin.guard';
import { SubscriptionAccessGuard } from './subscription-access.guard';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'fallback-secret-for-dev-only',
            signOptions: { expiresIn: '1d' },
        }),
    ],
    providers: [AuthService, JwtStrategy, PlatformAdminGuard, SubscriptionAccessGuard],
    controllers: [AuthController],
    exports: [AuthService, PlatformAdminGuard, SubscriptionAccessGuard],
})
export class AuthModule { }
