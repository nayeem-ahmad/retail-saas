import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NavigationService } from './navigation.service';
import type { NavScope } from '@erp71/shared-types';

@Controller('navigation')
@UseGuards(JwtAuthGuard)
export class NavigationController {
    constructor(private readonly navigation: NavigationService) {}

    @Get('layout')
    getLayout(@Query('scope') scope: NavScope = 'tenant' as NavScope) {
        return this.navigation.getLayout(scope);
    }
}