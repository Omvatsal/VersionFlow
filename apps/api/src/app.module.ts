import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AccessModule } from './access/access.module.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { RegistryModule } from './registry/registry.module.js';
import { DependenciesModule } from './dependencies/dependencies.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { ChangesModule } from './changes/changes.module.js';

@Module({
  imports: [HealthModule, AuthModule, AccessModule, OrganizationsModule, ProjectsModule, RegistryModule, DependenciesModule, AnalyticsModule, ChangesModule],
})
export class AppModule {}

