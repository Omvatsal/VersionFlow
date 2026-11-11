'use client';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { Save, ShieldCheck } from 'lucide-react';
import { apiClient, ProjectSettings as ProjectSettingsData } from '@/lib/api-client';

export function ProjectSettings({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ProjectSettingsData | null>(null); const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [slug, setSlug] = useState(''); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  useEffect(() => { void apiClient.projects.settings(projectId).then((result) => { if (result.success && result.data) { setData(result.data); setName(result.data.project.name); setDescription(result.data.project.description || ''); setSlug(result.data.project.slug); } else setMessage(result.error?.message || 'Could not load project settings.'); setLoading(false); }); }, [projectId]);
  async function save(event: FormEvent) { event.preventDefault(); setBusy(true); setMessage(''); const result = await apiClient.projects.updateSettings(projectId, { name, description: description || null, slug }); setBusy(false); if (!result.success) { setMessage(result.error?.message || 'Could not save settings.'); return; } setMessage('Project settings saved.'); }
  if (loading) return <div className="workspace-loading">Loading project settings…</div>;
  if (!data) return <div className="workspace-error">{message}</div>;
  return <div className="project-admin-page"><div className="page-heading"><div><p className="page-kicker">Project settings</p><h1>{data.project.name}</h1><p>Manage the project identity and review its access boundaries.</p></div><Link href={`/dashboard/projects/${projectId}/members`} className="button button-quiet"><ShieldCheck size={15}/> Members & access</Link></div>
    {message && <p className="inline-feedback">{message}</p>}
    <form className="admin-card settings-form" onSubmit={save}><div className="admin-card-heading"><div><p className="page-kicker">General</p><h2>Project identity</h2></div>{data.canManage && <button className="button button-primary" disabled={busy}><Save size={15}/> {busy ? 'Saving…' : 'Save changes'}</button>}</div><label>Project name<input value={name} onChange={(e) => setName(e.target.value)} disabled={!data.canManage}/></label><label>Slug<input value={slug} onChange={(e) => setSlug(e.target.value)} disabled={!data.canManage}/><small>Lowercase letters, numbers, and hyphens only.</small></label><label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} disabled={!data.canManage}/></label></form>
    <section className="admin-card"><p className="page-kicker">Read-only context</p><h2>Ownership and access</h2><div className="settings-facts"><div><small>Organization</small><b>{data.organization.name}</b></div><div><small>Your project role</small><b>{data.currentUserRole}</b></div><div><small>Created</small><b>{new Date(data.project.createdAt).toLocaleDateString()}</b></div><div><small>Project access</small><b>{data.canManage ? 'You can manage access' : 'Read-only for your role'}</b></div></div></section>
    <section className="admin-card"><p className="page-kicker">Integrations</p><h2>Repository connections</h2><p className="muted-copy">GitHub repository integration is not implemented in this milestone. No connection or scan is active.</p></section>
    <section className="admin-card danger-card"><p className="page-kicker">Danger zone</p><h2>Destructive actions are unavailable</h2><p className="muted-copy">Project archival and deletion are intentionally not exposed until a recoverable lifecycle model is available.</p></section>
  </div>;
}
