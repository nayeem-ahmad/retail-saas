import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { isPlatformAdminEmail } from './platform-admin.util';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const email = request.user?.email;

        if (!email) {
            throw new UnauthorizedException('Authentication is required');
        }

        if (!isPlatformAdminEmail(email)) {
            throw new ForbiddenException('Platform admin access is required');
        }

        request.isPlatformAdmin = true;
        return true;
    }
}