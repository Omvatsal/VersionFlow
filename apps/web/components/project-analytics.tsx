'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Boxes, GitBranch, Layers } from 'lucide-react';
import { apiClient, type AnalyticsOverview, type Dependency } from '@/lib/api-client';
import { BarChart } from './charts/bar-chart';
import { DonutChart } from './charts/donut-chart';
import { HorizontalBars, VerticalBars } from './charts/analytics-charts';

function labelFor(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

export function ProjectAnalytics({ projectId }: { projectId: string }) {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [apiRows, setApiRows] = useState<NonNullable<Awaited<ReturnType<typeof apiClient.analytics.apis>>['data']>>([]);
  const [versionRows, setVersionRows] = useState<NonNullable<Awaited<ReturnType<typeof apiClient.analytics.versions>>['data']>>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setData(null);
    setApiRows([]);
    setVersionRows([]);
    setDependencies([]);
    setError('');
    void Promise.all([
      apiClient.analytics.overview(projectId),
      apiClient.analytics.apis(projectId),
      apiClient.analytics.versions(projectId),
      apiClient.analytics.dependencies(projectId),
    ]).then(([overview, apis, versions, dependencyResult]) => {
      if (!mounted) return;
      if (!overview.success || !overview.data) {
        setError(overview.error?.message || 'Could not load analytics.');
        return;
      }
      setData(overview.data);
      if (apis.success && apis.data) setApiRows(apis.data);
      if (versions.success && versions.data) setVersionRows(versions.data);
      if (dependencyResult.success && dependencyResult.data) setDependencies(dependencyResult.data);
    });
    return () => { mounted = false; };
  }, [projectId]);

  const apiVersionCounts = useMemo(() => apiRows.map((item) => ({ label: item.api.name, value: Number(item.versions) })).sort((a, b) => b.value - a.value), [apiRows]);
  const endpointCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of versionRows) counts.set(item.api.id, (counts.get(item.api.id) || 0) + Number(item.endpoints));
    return apiRows.map((item) => ({ label: item.api.name, value: counts.get(item.api.id) || 0 })).sort((a, b) => b.value - a.value);
  }, [apiRows, versionRows]);
  const relationshipCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of dependencies) {
      const relationship = item?.dependency?.relationship;
      if (relationship) counts.set(relationship, (counts.get(relationship) || 0) + 1);
    }
    return [...counts.entries()].map(([label, value]) => ({ label: labelFor(label), value })).sort((a, b) => b.value - a.value);
  }, [dependencies]);
  const activityCounts = useMemo(() => {
    if (!data) return [];
    const counts = new Map<string, number>();
    for (const item of data.activity) counts.set(item.eventType, (counts.get(item.eventType) || 0) + 1);
    return [...counts.entries()].map(([label, value]) => ({ label: labelFor(label), value })).sort((a, b) => b.value - a.value);
  }, [data]);
  const versionStatusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of versionRows) counts.set(item.version.status, (counts.get(item.version.status) || 0) + 1);
    return [...counts.entries()].map(([label, value]) => ({ label: labelFor(label), value })).sort((a, b) => b.value - a.value);
  }, [versionRows]);

  if (error) return <div className="data-alert" role="alert">{error}</div>;
  if (!data) return <div className="data-state" role="status">Loading project intelligence…</div>;

  const cards = [['APIs', data.metrics.apis, Boxes], ['Versions', data.metrics.versions, GitBranch], ['Endpoints', data.metrics.endpoints, Layers], ['Dependencies', data.metrics.dependencies, Activity]] as const;
  return <div className="workspace-page">
    <div className="project-hero"><div><p className="page-kicker">Project intelligence</p><h2>Operational overview</h2><p>Signals from the APIs and relationships registered in this project.</p></div></div>
    <div className="analytics-metrics">{cards.map(([label, value, Icon]) => <article key={label}><Icon size={17}/><span>{label}</span><b>{value}</b></article>)}</div>
    <div className="analytics-grid"><section className="workspace-section"><div className="section-title-row"><div><p className="page-kicker">Registry growth</p><h3>APIs registered over time</h3></div></div><BarChart items={data.growth.map((item) => ({ label: new Date(item.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }), value: item.value }))}/></section><section className="workspace-section"><div className="section-title-row"><div><p className="page-kicker">Lifecycle</p><h3>API status distribution</h3></div></div><DonutChart items={data.lifecycle.map((item) => ({ label: item.lifecycle, value: item.value }))}/></section></div>
    <div className="analytics-graph-grid analytics-inventory-grid">
      <section className="workspace-section"><div className="section-title-row"><div><p className="page-kicker">API inventory</p><h3>Versions by API</h3></div><span>Registered depth</span></div><HorizontalBars items={apiVersionCounts} color="var(--chart-violet)" empty="No API versions recorded yet."/></section>
      <section className="workspace-section"><div className="section-title-row"><div><p className="page-kicker">Contract surface</p><h3>Endpoints by API</h3></div><span>Known surface area</span></div><HorizontalBars items={endpointCounts} color="var(--chart-endpoints)" empty="No endpoints recorded yet."/></section>
    </div>
    <div className="analytics-graph-grid analytics-signal-grid">
      <section className="workspace-section"><div className="section-title-row"><div><p className="page-kicker">Dependency signals</p><h3>Relationship mix</h3></div><span>{dependencies.length} total</span></div><VerticalBars items={relationshipCounts} color="var(--chart-violet)" empty="No dependency relationships recorded yet." glow={false}/></section>
      <section className="workspace-section"><div className="section-title-row"><div><p className="page-kicker">Recent activity</p><h3>Event frequency</h3></div><span>Last 12 events</span></div><VerticalBars items={activityCounts} color="var(--chart-blue)" colors={['var(--chart-blue)', 'var(--chart-orange)', 'var(--chart-emerald)', 'var(--chart-amber)', 'var(--chart-violet)']} empty="No activity recorded yet."/></section>
      <section className="workspace-section"><div className="section-title-row"><div><p className="page-kicker">Release posture</p><h3>Version status mix</h3></div><span>{versionRows.length} total</span></div><VerticalBars items={versionStatusCounts} color="var(--chart-emerald)" colors={['var(--chart-amber)', 'var(--chart-emerald)', 'var(--chart-blue)']} empty="No version statuses recorded yet."/></section>
    </div>
    <section className="workspace-section"><div className="section-title-row"><div><p className="page-kicker">Activity timeline</p><h3>Recent project events</h3></div></div>{data.activity.length ? <div className="activity-list">{data.activity.map((event) => <article key={event.id}><span className="timeline-dot"/><div><b>{event.summary}</b><time>{new Date(event.occurredAt).toLocaleString()}</time></div></article>)}</div> : <div className="empty-state"><b>No activity recorded yet</b><p>Register an API or version to start building project history.</p></div>}</section>
  </div>;
}
