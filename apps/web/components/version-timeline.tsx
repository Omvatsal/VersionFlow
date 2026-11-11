'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, GitBranch, Search } from 'lucide-react';
import { ContractViewer } from '@/components/contract-viewer';
import { apiClient, type ApiRecord, type ApiVersion } from '@/lib/api-client';
import { getTimelineStatusLabel } from '@/lib/version-timeline';

type Item = { version: ApiVersion; api: ApiRecord; endpoints: number };
const formats: Record<string, string> = { 'openapi-json': 'OpenAPI JSON', 'openapi-yaml': 'OpenAPI YAML', 'swagger-json': 'Swagger JSON', 'swagger-yaml': 'Swagger YAML', 'wsdl-xml': 'WSDL XML' };

export function VersionTimeline({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [apiId, setApiId] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { void apiClient.analytics.versions(projectId).then((result) => { if (result.success && result.data) setItems(result.data); else setError(result.error?.message || 'Could not load version history.'); setLoading(false); }); }, [projectId]);
  const apis = useMemo(() => Array.from(new Map(items.map((item) => [item.api.id, item.api])).values()).sort((a, b) => a.name.localeCompare(b.name)), [items]);
  const filtered = useMemo(() => items.filter((item) => { const time = new Date(item.version.publishedAt || item.version.createdAt).getTime(); return (!apiId || item.api.id === apiId) && (status === 'all' || item.version.status === status) && (!from || time >= new Date(from).getTime()) && (!to || time <= new Date(`${to}T23:59:59`).getTime()); }).sort((a, b) => new Date(a.version.publishedAt || a.version.createdAt).getTime() - new Date(b.version.publishedAt || b.version.createdAt).getTime()), [items, apiId, status, from, to]);
  const groups = useMemo(() => Array.from(new Map(filtered.map((item) => [item.api.id, filtered.filter((entry) => entry.api.id === item.api.id)])).entries()).map(([id, versions]) => ({ api: apis.find((api) => api.id === id)!, versions })), [filtered, apis]);

  if (loading) return <div className="data-state" role="status">Loading version timeline...</div>;
  if (error) return <div className="data-alert" role="alert">{error}</div>;
  return <div className="workspace-page version-timeline-page"><div className="timeline-heading"><div><p className="page-kicker">API management</p><h2>Version timeline</h2><p>Click anywhere on a version card to expand its preserved contract.</p></div><GitBranch size={20} /></div><section className="timeline-controls"><label className="timeline-api-search"><Search size={15} /><input list="timeline-api-options" value={apis.find((api) => api.id === apiId)?.name || query} onChange={(event) => { const value = event.target.value; setQuery(value); setApiId(apis.find((api) => api.name === value)?.id || ''); }} placeholder="Search APIs or choose all" /><datalist id="timeline-api-options">{apis.filter((api) => api.name.toLowerCase().includes(query.toLowerCase())).map((api) => <option key={api.id} value={api.name} />)}</datalist></label><label>Lifecycle<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="deprecated">Deprecated</option><option value="sunset">Sunset</option></select></label><label>From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label></section>{groups.length ? <div className="timeline-groups">{groups.map((group) => <section className="timeline-group" key={group.api.id}><div className="timeline-group-heading"><div><p className="page-kicker">API history</p><h3>{group.api.name}</h3></div><span>{group.versions.length} releases</span></div><div className="version-timeline">{group.versions.map((item, index) => <TimelineCard key={item.version.id} projectId={projectId} item={item} latest={index === group.versions.length - 1} expanded={expanded === item.version.id} onToggle={() => setExpanded(expanded === item.version.id ? null : item.version.id)} />)}</div></section>)}</div> : <div className="empty-state"><CalendarDays size={22} /><b>No versions match these filters</b><p>Adjust the API, lifecycle, or date filters.</p></div>}</div>;
}

function TimelineCard({ projectId, item, latest, expanded, onToggle }: { projectId: string; item: Item; latest: boolean; expanded: boolean; onToggle: () => void }) {
  const date = item.version.publishedAt || item.version.createdAt;
  const handleClick = (event: React.MouseEvent<HTMLElement>) => { if ((event.target as HTMLElement).closest('.contract-inline')) return; onToggle(); };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onToggle(); } };
  return <article className={`version-timeline-item ${item.version.status} ${latest ? 'latest' : ''}`}><div className="version-timeline-rail"><span className="version-timeline-node" /></div><div className="version-card" role="button" tabIndex={0} aria-expanded={expanded} onClick={handleClick} onKeyDown={handleKeyDown}><div className="version-card-toggle"><div className="version-card-top"><div><div className="version-title-row"><h4>v{item.version.version}</h4>{latest && <span className="latest-badge">Latest</span>}</div><p className="version-format">{formats[item.version.specificationFormat] || item.version.specificationFormat}</p></div><span className={`version-status ${item.version.status}`}>{getTimelineStatusLabel(item.version.status)}</span></div><div className="version-card-meta"><span><CalendarDays size={13} />{new Date(date).toLocaleDateString()}</span><span>{item.endpoints} endpoints</span></div>{expanded && <div className="version-card-details"><p>{item.version.sourceSpecificationVersion ? `Specification source version ${item.version.sourceSpecificationVersion}.` : 'No recorded change description for this version.'}</p>{item.version.deprecatedAt && <small>Deprecated {new Date(item.version.deprecatedAt).toLocaleDateString()}</small>}{item.version.sunsetAt && <small>Sunset {new Date(item.version.sunsetAt).toLocaleDateString()}</small>}<ChevronDown size={15} /></div>}</div>{expanded && <ContractViewer inline projectId={projectId} apiId={item.api.id} versionId={item.version.id} onClose={onToggle} />}</div></article>;
}
