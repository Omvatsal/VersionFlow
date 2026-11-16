'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock3, GitBranch } from 'lucide-react';
import { apiClient, type AnalyticsOverview } from '@/lib/api-client';

export function VersionHistory({ projectId }: { projectId: string }) {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    void apiClient.analytics.overview(projectId).then((result) => {
      if (!mounted) return;
      if (result.success && result.data) setData(result.data);
      else setError(result.error?.message || 'Could not load version history.');
    });
    return () => { mounted = false; };
  }, [projectId]);

  const versionEvents = useMemo(() => data?.activity.filter((event) => event.eventType.startsWith('version_')) || [], [data]);

  if (error) return <div className="data-alert" role="alert">{error}</div>;
  if (!data) return <div className="data-state" role="status">Loading version history…</div>;

  return <div className="workspace-page version-history-page">
    <div className="timeline-heading"><div><p className="page-kicker">Analysis / version history</p><h2>Version history</h2><p>A chronological record of version creation, publication, and deprecation across this project.</p></div><Clock3 size={20}/></div>
    <div className="analytics-metrics version-history-summary"><article><GitBranch size={17}/><span>Version events</span><b>{versionEvents.length}</b></article><article><Clock3 size={17}/><span>Tracked releases</span><b>{data.metrics.versions}</b></article></div>
    {versionEvents.length ? <section className="workspace-section"><div className="section-title-row"><div><p className="page-kicker">Chronological record</p><h3>Release activity</h3></div><span>{versionEvents.length} events</span></div><div className="activity-list version-history-list">{versionEvents.map((event) => <article key={event.id}><span className={`timeline-dot ${event.eventType.replace('version_', '')}`}/><div><b>{event.summary}</b><time>{new Date(event.occurredAt).toLocaleString()}</time></div></article>)}</div></section> : <div className="empty-state"><b>No version history recorded yet</b><p>Publish or deprecate an API version to build the project history.</p></div>}
  </div>;
}
