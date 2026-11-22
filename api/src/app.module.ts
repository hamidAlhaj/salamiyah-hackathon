import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuditModule } from './audit/audit.module';
import { CollectorModule } from './collector/collector.module';
import { AuthModule } from './auth/auth.module';
import { BeneficiariesModule } from './beneficiaries/beneficiaries.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { CategoriesModule } from './categories/categories.module';
import { CasesModule } from './cases/cases.module';
import { AccessModule } from './common/access/access.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ExpendituresModule } from './expenditures/expenditures.module';
import { HealthController } from './health.controller';
import { LookupsModule } from './hospitals/lookups.module';
import { ImportsModule } from './imports/imports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { PledgesModule } from './pledges/pledges.module';
import { PrismaModule } from './prisma/prisma.module';
import { StatsModule } from './stats/stats.module';
import { StorageModule } from './storage/storage.module';
import { UsersModule } from './users/users.module';
import { VerificationsModule } from './verifications/verifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting stays global (an extra library, not an auth decision). Auth is per controller.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AccessModule,
    StorageModule,
    AuditModule,
    NotificationsModule,
    AuthModule,
    CategoriesModule,
    CampaignsModule,
    BeneficiariesModule,
    PaymentMethodsModule,
    CasesModule,
    PledgesModule,
    CollectorModule,
    VerificationsModule,
    ExpendituresModule,
    StatsModule,
    LookupsModule,
    UsersModule,
    ImportsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
