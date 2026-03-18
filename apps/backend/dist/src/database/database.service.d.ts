import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@retail-saas/database';
export declare class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
