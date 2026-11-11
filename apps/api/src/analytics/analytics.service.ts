import { Injectable } from '@nestjs/common';
import { asc, count, desc, eq, sql } from 'drizzle-orm';
import { apiActivityEvents, apiChanges, apiDependencies, apiEndpoints, apiImpactFindings, apiVersions, apis, getDatabaseConnection } from '@versionflow/database';
import { AccessService } from '../access/access.service.js';

@Injectable()
export class AnalyticsService {
  constructor(private readonly access: AccessService) {}
  private async scope(userId: string, projectId: string) { await this.access.projectAccess(userId, projectId); return getDatabaseConnection().db; }
  async overview(userId: string, projectId: string) {
    const db = await this.scope(userId, projectId);
    const [apiCount, versionCount, endpointCount, dependencyCount, lifecycle, activity] = await Promise.all([
      db.select({ value: count() }).from(apis).where(eq(apis.projectId, projectId)),
      db.select({ value: count() }).from(apiVersions).innerJoin(apis, eq(apis.id, apiVersions.apiId)).where(eq(apis.projectId, projectId)),
      db.select({ value: count() }).from(apiEndpoints).innerJoin(apiVersions, eq(apiVersions.id, apiEndpoints.apiVersionId)).innerJoin(apis, eq(apis.id, apiVersions.apiId)).where(eq(apis.projectId, projectId)),
      db.select({ value: count() }).from(apiDependencies).innerJoin(apiVersions, eq(apiVersions.id, apiDependencies.sourceApiVersionId)).innerJoin(apis, eq(apis.id, apiVersions.apiId)).where(eq(apis.projectId, projectId)),
      db.select({ lifecycle: apis.lifecycle, value: count() }).from(apis).where(eq(apis.projectId, projectId)).groupBy(apis.lifecycle),
      db.select().from(apiActivityEvents).where(eq(apiActivityEvents.projectId, projectId)).orderBy(desc(apiActivityEvents.occurredAt)).limit(12),
    ]);
    return { metrics: { apis: Number(apiCount[0]?.value || 0), versions: Number(versionCount[0]?.value || 0), endpoints: Number(endpointCount[0]?.value || 0), dependencies: Number(dependencyCount[0]?.value || 0) }, lifecycle, activity, growth: await this.growth(db, projectId) };
  }
  private async growth(db: ReturnType<typeof getDatabaseConnection>['db'], projectId: string) { return db.select({ date: sql<string>`date_trunc('month', ${apis.createdAt})`, value: count() }).from(apis).where(eq(apis.projectId, projectId)).groupBy(sql`date_trunc('month', ${apis.createdAt})`).orderBy(asc(sql`date_trunc('month', ${apis.createdAt})`)); }
  async apis(userId: string, projectId: string) { const db = await this.scope(userId, projectId); return db.select({ api: apis, versions: count(apiVersions.id) }).from(apis).leftJoin(apiVersions, eq(apiVersions.apiId, apis.id)).where(eq(apis.projectId, projectId)).groupBy(apis.id).orderBy(desc(apis.updatedAt)); }
  async versions(userId: string, projectId: string) { const db = await this.scope(userId, projectId); return db.select({ version: apiVersions, api: apis, endpoints: count(apiEndpoints.id) }).from(apiVersions).innerJoin(apis, eq(apis.id, apiVersions.apiId)).leftJoin(apiEndpoints, eq(apiEndpoints.apiVersionId, apiVersions.id)).where(eq(apis.projectId, projectId)).groupBy(apiVersions.id, apis.id).orderBy(desc(apiVersions.createdAt)); }
  async dependencies(userId: string, projectId: string) { const db = await this.scope(userId, projectId); return db.select().from(apiDependencies).innerJoin(apiVersions, eq(apiVersions.id, apiDependencies.sourceApiVersionId)).innerJoin(apis, eq(apis.id, apiVersions.apiId)).where(eq(apis.projectId, projectId)).orderBy(desc(apiDependencies.createdAt)); }
  async impact(userId: string, projectId: string) { const db = await this.scope(userId, projectId); const [changes, findings] = await Promise.all([db.select().from(apiChanges).where(eq(apiChanges.projectId, projectId)).orderBy(desc(apiChanges.detectedAt)), db.select().from(apiImpactFindings).where(eq(apiImpactFindings.projectId, projectId)).orderBy(desc(apiImpactFindings.detectedAt))]); return { available: true, changes, findings, summary: { totalChanges: changes.length, breakingChanges: changes.filter((item) => item.classification === 'breaking').length, potentiallyBreaking: changes.filter((item) => item.classification === 'potentially_breaking').length, openFindings: findings.filter((item) => item.status === 'open').length } }; }
}
