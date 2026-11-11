import { describe, expect, it } from 'vitest';
import { deriveImpactView } from '../lib/impact-analytics';
import type { EnrichedImpactFinding } from '../lib/api-client';

const finding = (id: string, impact: 'direct' | 'transitive', dependentApiId: string, depth: number): EnrichedImpactFinding => ({ id, projectId: 'project', changeId: 'change', dependencyId: `dependency-${id}`, changedApiId: 'upstream', dependentApiId, dependentVersionId: null, affectedEndpointId: id === 'one' ? 'endpoint' : null, impact, propagationDepth: depth, severity: id === 'one' ? 'high' : 'medium', confidence: impact === 'direct' ? 'strong_evidence' : 'insufficient_evidence', status: 'open', evidence: 'Persisted dependency evidence', explanation: 'Test fixture', detectedAt: '2026-11-10T10:00:00.000Z', changedApiName: 'Inventory API', dependentApiName: dependentApiId, sourceVersion: '1.0.0', targetVersion: '2.0.0', changeType: 'removed_endpoint', changeCategory: 'endpoint', contractPath: '/paths/items/get', relationship: 'calls', affectedEndpoint: null });

describe('impact analytics view', () => {
  it('deduplicates impacted APIs while preserving path totals', () => {
    const view = deriveImpactView([finding('one', 'direct', 'Orders API', 1), finding('two', 'transitive', 'Orders API', 2), finding('three', 'transitive', 'Billing API', 2)]);
    expect(view.summary.impactedApis).toBe(2);
    expect(view.summary.directApis).toBe(1);
    expect(view.summary.transitiveApis).toBe(2);
    expect(view.depth.find((row) => row.depth === 2)).toMatchObject({ uniqueApis: 2, paths: 2 });
    expect(view.summary.affectedEndpoints).toBe(1);
  });
});
