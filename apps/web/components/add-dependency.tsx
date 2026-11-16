'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Link2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient, type ApiRecord, type ApiVersion } from '@/lib/api-client';

export function AddDependency({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [apis, setApis] = useState<ApiRecord[]>([]);
  const [versions, setVersions] = useState<ApiVersion[]>([]);
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [relationship, setRelationship] = useState('calls');
  const [type, setType] = useState<'internal' | 'external'>('internal');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    void apiClient.registry.list(projectId).then(async (result) => {
      if (!mounted) return;
      if (!result.success || !result.data) { setError(result.error?.message || 'Could not load API versions.'); setLoading(false); return; }
      setApis(result.data);
      const results = await Promise.all(result.data.map((api) => apiClient.registry.versions(projectId, api.id)));
      if (mounted) { setVersions(results.flatMap((item) => item.data || [])); setLoading(false); }
    });
    return () => { mounted = false; };
  }, [projectId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError('');
    const result = await apiClient.dependencies.create(projectId, { sourceApiVersionId: source, targetApiVersionId: target, dependencyType: type, relationship, description: description || undefined, evidence: evidence || undefined });
    setBusy(false);
    if (!result.success) { setError(result.error?.message || 'Could not create dependency.'); return; }
    router.push(`/dashboard/projects/${projectId}/dependencies`);
  }

  if (loading) return <div className="data-state" role="status">Loading dependency setup…</div>;
  if (error && !versions.length) return <div className="data-alert" role="alert">{error}</div>;

  return <div className="workspace-page add-dependency-page"><button className="back-link" type="button" onClick={() => router.push(`/dashboard/projects/${projectId}/dependencies`)}><ArrowLeft size={14}/> Back to dependency registry</button><div className="project-hero"><div><p className="page-kicker">Dependency intelligence</p><h2>Add dependency</h2><p>Record a relationship between two API versions so impact analysis can trace it.</p></div><Link2 size={24}/></div><section className="workspace-section add-dependency-card"><div className="section-title-row"><div><p className="page-kicker">Relationship definition</p><h3>Connect API versions</h3><p>Choose the source and target, then describe the evidence behind the relationship.</p></div></div>{error && <div className="data-alert" role="alert">{error}</div>}<form className="dependency-form" onSubmit={submit} noValidate><label>Source version<select value={source} onChange={(event) => setSource(event.target.value)} required><option value="">Select source version</option>{versions.map((version) => <option key={version.id} value={version.id}>{apis.find((api) => api.id === version.apiId)?.name} · {version.version}</option>)}</select></label><label>Target version<select value={target} onChange={(event) => setTarget(event.target.value)} required><option value="">Select target version</option>{versions.filter((version) => version.id !== source).map((version) => <option key={version.id} value={version.id}>{apis.find((api) => api.id === version.apiId)?.name} · {version.version}</option>)}</select></label><label>Relationship<select value={relationship} onChange={(event) => setRelationship(event.target.value)}><option>calls</option><option>consumes</option><option>produces</option><option>requires</option><option>references</option></select></label><label>Dependency type<select value={type} onChange={(event) => setType(event.target.value as 'internal' | 'external')}><option value="internal">Internal</option><option value="external">External</option></select></label><label className="dependency-wide">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Orders API calls Customer API to validate ownership." rows={3}/></label><label className="dependency-wide">Evidence<input value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Service contract, specification path, or team confirmation"/></label><div className="add-dependency-actions"><button className="button button-quiet" type="button" onClick={() => router.push(`/dashboard/projects/${projectId}/dependencies`)}>Cancel</button><button className="button button-primary" type="submit" disabled={busy || !source || !target}><Plus size={15}/>{busy ? 'Adding dependency…' : 'Add dependency'}</button></div></form></section></div>;
}
