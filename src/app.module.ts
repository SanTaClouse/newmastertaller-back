import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';

import { typeOrmConfig } from './config/typeorm.config';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { RepairPhasesModule } from './modules/repair-phases/repair-phases.module';
import { StatsModule } from './modules/stats/stats.module';
import { CarCatalogModule } from './modules/car-catalog/car-catalog.module';
import { PublicTrackingModule } from './modules/public-tracking/public-tracking.module';
import { BootstrapSeedService } from './database/seeds/bootstrap-seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    ClientsModule,
    VehiclesModule,
    WorkOrdersModule,
    ExpensesModule,
    RepairPhasesModule,
    StatsModule,
    CarCatalogModule,
    PublicTrackingModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector) => new JwtAuthGuard(reflector),
      inject: [Reflector],
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) => new TenantContextInterceptor(reflector),
      inject: [Reflector],
    },
    BootstrapSeedService,
  ],
})
export class AppModule {}
