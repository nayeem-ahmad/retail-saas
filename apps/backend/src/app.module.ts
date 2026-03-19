import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { AssetsModule } from './assets/assets.module';
import { SalesModule } from './sales/sales.module';
import { CustomersModule } from './customers/customers.module';
import { CustomerGroupsModule } from './customer-groups/customer-groups.module';
import { TerritoriesModule } from './territories/territories.module';
import { SalesReturnsModule } from './sales-returns/sales-returns.module';
import { SalesOrdersModule } from './sales-orders/sales-orders.module';
import { SalesQuotationsModule } from './sales-quotations/sales-quotations.module';
import { CashierSessionsModule } from './cashier-sessions/cashier-sessions.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [
        DatabaseModule, 
        AuthModule, 
        ProductsModule, 
        AssetsModule, 
        SalesModule, 
        CustomersModule,
        CustomerGroupsModule,
        TerritoriesModule,
        SalesReturnsModule,
        SalesOrdersModule,
        SalesQuotationsModule,
        CashierSessionsModule,
        ScheduleModule.forRoot()
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
