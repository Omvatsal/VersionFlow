import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';

@Module({ imports: [AccessModule, AuthModule], controllers: [AnalyticsController], providers: [AnalyticsService] })
export class AnalyticsModule {}
