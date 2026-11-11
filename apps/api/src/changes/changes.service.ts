import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { apiChanges, apiContractSnapshots, apiDependencies, apiEndpoints, apiImpactFindings, apiImpactStatusHistory, apiVersions, apis, getDatabaseConnection } from '@versionflow/database';
import { AccessService } from '../access/access.service.js';

type ContractEndpoint = { id?: string; method?: string; path?: string; operationId?: string | null; parameters?: unknown; requestSchema?: unknown; responseSchema?: unknown; security?: unknown };
type Diff = { category: string; changeType: string; contractPath: string; previousValue: unknown; newValue: unknown; classification: 'breaking' | 'non_breaking' | 'potentially_breaking' | 'informational'; severity: 'critical' | 'high' | 'medium' | 'low' | 'informational'; explanation: string; endpointId?: string };

function endpointKey(endpoint: ContractEndpoint) { return `${String(endpoint.method || '').toUpperCase()} ${endpoint.path || ''}`; }
function same(a: unknown, b: unknown) { return JSON.stringify(a) === JSON.stringify(b); }

@Injectable()
export class ChangesService {
  constructor(private readonly access: AccessService) {}

  private async versions(userId: string, projectId: string, sourceVersionId: string, targetVersionId: string) {
    await this.access.projectAccess(userId, projectId);
    const db = getDatabaseConnection().db;
    const rows = await db.select({ version: apiVersions, api: apis, snapshot: apiContractSnapshots }).from(apiVersions).innerJoin(apis, eq(apis.id, apiVersions.apiId)).leftJoin(apiContractSnapshots, eq(apiContractSnapshots.apiVersionId, apiVersions.id)).where(and(eq(apis.projectId, projectId), eq(apiVersions.id, sourceVersionId)));
    const targetRows = await db.select({ version: apiVersions, api: apis, snapshot: apiContractSnapshots }).from(apiVersions).innerJoin(apis, eq(apis.id, apiVersions.apiId)).leftJoin(apiContractSnapshots, eq(apiContractSnapshots.apiVersionId, apiVersions.id)).where(and(eq(apis.projectId, projectId), eq(apiVersions.id, targetVersionId)));
    const source = rows[0]; const target = targetRows[0];
    if (!source || !target || source.api.id !== target.api.id) throw new NotFoundException('Both versions must belong to the same project API');
    return { db, source, target };
  }

  async compare(userId: string, projectId: string, sourceVersionId: string, targetVersionId: string) {
    const { db, source, target } = await this.versions(userId, projectId, sourceVersionId, targetVersionId);
    const sourceEndpoints = await db.select().from(apiEndpoints).where(eq(apiEndpoints.apiVersionId, sourceVersionId));
    const targetEndpoints = await db.select().from(apiEndpoints).where(eq(apiEndpoints.apiVersionId, targetVersionId));
    const sourceMap = new Map(sourceEndpoints.map((item) => [endpointKey(item), item]));
    const targetMap = new Map(targetEndpoints.map((item) => [endpointKey(item), item]));
    const diffs: Diff[] = [];
    for (const [key, endpoint] of sourceMap) if (!targetMap.has(key)) diffs.push({ category: 'endpoint', changeType: 'removed_endpoint', contractPath: `/paths/${endpoint.path}/${String(endpoint.method).toLowerCase()}`, previousValue: endpoint, newValue: null, classification: 'breaking', severity: 'high', explanation: 'An endpoint accepted by the previous contract is no longer present.', endpointId: endpoint.id });
    for (const [key, endpoint] of targetMap) if (!sourceMap.has(key)) diffs.push({ category: 'endpoint', changeType: 'added_endpoint', contractPath: `/paths/${endpoint.path}/${String(endpoint.method).toLowerCase()}`, previousValue: null, newValue: endpoint, classification: 'non_breaking', severity: 'low', explanation: 'A new endpoint was added to the contract.', endpointId: endpoint.id });
    for (const [key, before] of sourceMap) {
      const after = targetMap.get(key); if (!after) continue;
      const fields: Array<[keyof ContractEndpoint, string]> = [['parameters', 'parameters'], ['requestSchema', 'request_schema'], ['responseSchema', 'response_schema'], ['security', 'security']];
      for (const [field, label] of fields) if (!same(before[field], after[field])) diffs.push({ category: label === 'security' ? 'security' : 'schema', changeType: `modified_${label}`, contractPath: `/paths/${before.path}/${String(before.method).toLowerCase()}/${label}`, previousValue: before[field], newValue: after[field], classification: label === 'response_schema' ? 'potentially_breaking' : 'potentially_breaking', severity: 'medium', explanation: `The ${label.replace('_', ' ')} changed; compatibility requires review.`, endpointId: after.id });
      if (before.operationId !== after.operationId) diffs.push({ category: 'endpoint', changeType: 'operation_id_changed', contractPath: `/paths/${before.path}/${String(before.method).toLowerCase()}/operationId`, previousValue: before.operationId, newValue: after.operationId, classification: 'informational', severity: 'informational', explanation: 'The operation identifier changed.', endpointId: after.id });
    }
    const changes = await db.transaction(async (tx) => {
      const inserted = [];
      for (const diff of diffs) {
        const [row] = await tx.insert(apiChanges).values({ projectId, apiId: source.api.id, sourceVersionId, targetVersionId, endpointId: diff.endpointId, category: diff.category, changeType: diff.changeType, contractPath: diff.contractPath, previousValue: diff.previousValue, newValue: diff.newValue, classification: diff.classification, severity: diff.severity, explanation: diff.explanation }).onConflictDoNothing().returning();
        if (row) inserted.push(row);
      }
      return inserted;
    });
    return { sourceVersion: source.version, targetVersion: target.version, changes, total: diffs.length };
  }

  async list(userId: string, projectId: string) { await this.access.projectAccess(userId, projectId); return getDatabaseConnection().db.select().from(apiChanges).where(eq(apiChanges.projectId, projectId)).orderBy(desc(apiChanges.detectedAt)); }
  async impacts(userId: string, projectId: string) { await this.access.projectAccess(userId, projectId); return getDatabaseConnection().db.select().from(apiImpactFindings).where(eq(apiImpactFindings.projectId, projectId)).orderBy(desc(apiImpactFindings.detectedAt)); }

  async analytics(userId: string, projectId: string) {
    await this.access.projectAccess(userId, projectId);
    const db = getDatabaseConnection().db;
    const [apiRows, versionRows, endpointRows, changes, findings, dependencies, history] = await Promise.all([
      db.select().from(apis).where(eq(apis.projectId, projectId)),
      db.select({ version: apiVersions, apiId: apis.id }).from(apiVersions).innerJoin(apis, eq(apis.id, apiVersions.apiId)).where(eq(apis.projectId, projectId)),
      db.select({ endpoint: apiEndpoints, apiId: apis.id }).from(apiEndpoints).innerJoin(apiVersions, eq(apiVersions.id, apiEndpoints.apiVersionId)).innerJoin(apis, eq(apis.id, apiVersions.apiId)).where(eq(apis.projectId, projectId)),
      db.select().from(apiChanges).where(eq(apiChanges.projectId, projectId)).orderBy(desc(apiChanges.detectedAt)),
      db.select().from(apiImpactFindings).where(eq(apiImpactFindings.projectId, projectId)).orderBy(desc(apiImpactFindings.detectedAt)),
      db.select({ dependency: apiDependencies }).from(apiDependencies).innerJoin(apiVersions, eq(apiVersions.id, apiDependencies.sourceApiVersionId)).innerJoin(apis, eq(apis.id, apiVersions.apiId)).where(eq(apis.projectId, projectId)),
      db.select({ event: apiImpactStatusHistory }).from(apiImpactStatusHistory).innerJoin(apiImpactFindings, eq(apiImpactFindings.id, apiImpactStatusHistory.findingId)).where(eq(apiImpactFindings.projectId, projectId)).orderBy(desc(apiImpactStatusHistory.occurredAt)),
    ]);
    const apiById = new Map(apiRows.map((api) => [api.id, api]));
    const versionById = new Map(versionRows.map(({ version }) => [version.id, version]));
    const endpointById = new Map(endpointRows.map(({ endpoint }) => [endpoint.id, endpoint]));
    const changeById = new Map(changes.map((change) => [change.id, change]));
    const severityRank: Record<string, number> = { informational: 0, low: 1, medium: 2, high: 3, critical: 4 };
    const enrichedFindings = findings.map((finding) => { const change = changeById.get(finding.changeId); const dependency = dependencies.find((row) => row.dependency.id === finding.dependencyId)?.dependency; return { ...finding, changedApiName: apiById.get(finding.changedApiId)?.name || 'Unknown API', dependentApiName: apiById.get(finding.dependentApiId)?.name || 'Unknown API', sourceVersion: change ? versionById.get(change.sourceVersionId)?.version || null : null, targetVersion: change ? versionById.get(change.targetVersionId)?.version || null : null, changeType: change?.changeType || 'unknown', changeCategory: change?.category || 'other', contractPath: change?.contractPath || null, relationship: dependency?.relationship || null, affectedEndpoint: finding.affectedEndpointId ? endpointById.get(finding.affectedEndpointId) || null : null } });
    const impactedApiIds = new Set(findings.map((item) => item.dependentApiId));
    const directApiIds = new Set(findings.filter((item) => item.impact === 'direct').map((item) => item.dependentApiId));
    const transitiveApiIds = new Set(findings.filter((item) => item.impact === 'transitive').map((item) => item.dependentApiId));
    const affectedEndpoints = new Set(findings.flatMap((item) => item.affectedEndpointId ? [item.affectedEndpointId] : []));
    const severity = ['critical', 'high', 'medium', 'low', 'informational'].map((name) => ({ name, count: findings.filter((item) => item.severity === name).length }));
    const byDay = new Map<string, Record<string, number>>();
    findings.forEach((item) => { const day = item.detectedAt.toISOString().slice(0, 10); const values = byDay.get(day) || { critical: 0, high: 0, medium: 0, low: 0, informational: 0 }; values[item.severity] = (values[item.severity] || 0) + 1; byDay.set(day, values); });
    const apiRisk = [...impactedApiIds].map((apiId) => { const rows = enrichedFindings.filter((item) => item.dependentApiId === apiId); const upstream = new Set(rows.map((item) => item.changedApiId)); const relationships = new Set(rows.flatMap((item) => item.dependencyId ? [item.dependencyId] : [])); const endpoints = new Set(rows.flatMap((item) => item.affectedEndpointId ? [item.affectedEndpointId] : [])); const highest = rows.reduce((current, item) => (severityRank[item.severity] ?? -1) > (severityRank[current] ?? -1) ? item.severity : current, 'informational'); return { apiId, name: apiById.get(apiId)?.name || 'Unknown API', findings: rows.length, upstreamApis: upstream.size, relationships: relationships.size, affectedEndpoints: endpoints.size, highestSeverity: highest }; });
    const categoryNames = [...new Set(enrichedFindings.map((item) => item.changeType))];
    const categorySeverity = categoryNames.map((category) => ({ category, values: Object.fromEntries(severity.map((item) => [item.name, enrichedFindings.filter((finding) => finding.changeType === category && finding.severity === item.name).length])) }));
    const depth = [1, 2, 3, 4].map((level) => { const rows = findings.filter((item) => level === 4 ? item.propagationDepth >= 4 : item.propagationDepth === level); return { depth: level, label: level === 1 ? 'Direct' : level === 4 ? 'Depth 4+' : `Depth ${level}`, uniqueApis: new Set(rows.map((item) => item.dependentApiId)).size, paths: rows.length }; });
    const matrix = [...new Map(enrichedFindings.map((item) => [`${item.changedApiId}:${item.dependentApiId}`, { upstreamApiId: item.changedApiId, upstreamApiName: item.changedApiName, dependentApiId: item.dependentApiId, dependentApiName: item.dependentApiName, findings: enrichedFindings.filter((row) => row.changedApiId === item.changedApiId && row.dependentApiId === item.dependentApiId) }])).values()].map((cell) => ({ ...cell, count: cell.findings.length, highestSeverity: cell.findings.reduce((current, item) => (severityRank[item.severity] ?? -1) > (severityRank[current] ?? -1) ? item.severity : current, 'informational') }));
    return { summary: { impactedApis: impactedApiIds.size, directApis: directApiIds.size, transitiveApis: transitiveApiIds.size, highRiskFindings: findings.filter((item) => item.severity === 'critical' || item.severity === 'high').length, affectedEndpoints: affectedEndpoints.size, openFindings: findings.filter((item) => item.status === 'open' || item.status === 'under_review').length }, apis: apiRows, changes, findings: enrichedFindings, dependencies: dependencies.map((row) => row.dependency), severity, timeSeries: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, ...values })), apiRisk, categorySeverity, depth, matrix, statusHistory: history.map(({ event }) => event) };
  }

  async analyze(userId: string, projectId: string, changeId: string) {
    await this.access.projectAccess(userId, projectId);
    const db = getDatabaseConnection().db;
    const [change] = await db.select().from(apiChanges).where(and(eq(apiChanges.id, changeId), eq(apiChanges.projectId, projectId))).limit(1);
    if (!change) throw new NotFoundException('Change not found');
    const [dependencies, projectVersions] = await Promise.all([
      db.select({ dependency: apiDependencies, sourceApi: apis }).from(apiDependencies).innerJoin(apiVersions, eq(apiVersions.id, apiDependencies.sourceApiVersionId)).innerJoin(apis, eq(apis.id, apiVersions.apiId)).where(eq(apis.projectId, projectId)),
      db.select({ versionId: apiVersions.id, apiId: apis.id }).from(apiVersions).innerJoin(apis, eq(apis.id, apiVersions.apiId)).where(eq(apis.projectId, projectId)),
    ]);
    const apiByVersion = new Map(projectVersions.map((row) => [row.versionId, row.apiId]));
    const edges = dependencies.map((row) => ({ ...row, targetApiId: row.dependency.targetApiId || (row.dependency.targetApiVersionId ? apiByVersion.get(row.dependency.targetApiVersionId) : undefined) })).filter((row): row is typeof row & { targetApiId: string } => Boolean(row.targetApiId));
    const queue: Array<{ apiId: string; depth: number }> = [{ apiId: change.apiId, depth: 0 }];
    const bestDepth = new Map<string, number>([[change.apiId, 0]]);
    const findings = [];
    while (queue.length) {
      const current = queue.shift()!;
      for (const row of edges.filter((edge) => edge.sourceApi.id === current.apiId)) {
        const depth = current.depth + 1;
        if (row.targetApiId === change.apiId) continue;
        const previousDepth = bestDepth.get(row.targetApiId);
        if (previousDepth === undefined || depth < previousDepth) { bestDepth.set(row.targetApiId, depth); queue.push({ apiId: row.targetApiId, depth }); }
        const direct = depth === 1;
        const endpointEvidence = direct && Boolean(row.dependency.sourceEndpointId || row.dependency.targetEndpointId);
        const [finding] = await db.insert(apiImpactFindings).values({ projectId, changeId, dependencyId: row.dependency.id, changedApiId: change.apiId, dependentApiId: row.targetApiId, dependentVersionId: row.dependency.targetApiVersionId, impact: direct ? 'direct' : 'transitive', propagationDepth: depth, severity: direct ? change.severity : change.severity === 'critical' ? 'high' : change.severity, confidence: endpointEvidence ? 'strong_evidence' : direct ? 'partial_evidence' : 'insufficient_evidence', evidence: row.dependency.evidence || (direct ? 'API-level dependency only; consumer contract usage is not recorded.' : `Reachable through a dependency path of depth ${depth}; contract usage is not demonstrated.`), explanation: endpointEvidence ? 'The dependency contains endpoint evidence related to the changed API.' : direct ? 'The dependency establishes direct reachability, but does not prove contract-level exposure.' : 'This is a transitive potential impact and is not confirmed breakage.' }).onConflictDoNothing().returning();
        if (finding) { findings.push(finding); await db.insert(apiImpactStatusHistory).values({ findingId: finding.id, fromStatus: null, toStatus: 'open', changedBy: userId, note: 'Impact finding detected by analysis.' }); }
      }
    }
    return { change, findings };
  }
}
