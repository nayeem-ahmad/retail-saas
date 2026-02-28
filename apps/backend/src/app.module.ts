import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { AssetsModule } from './assets/assets.module';
import { SalesModule } from './sales/sales.module';

@Module({
    imports: [DatabaseModule, AuthModule, ProductsModule, AssetsModule, SalesModule],
    controllers: [],
    providers: [],
})
export class AppModule { }
