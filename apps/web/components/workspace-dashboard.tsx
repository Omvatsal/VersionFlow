'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, FolderKanban, Plus, Users } from 'lucide-react';
import { apiClient, type AuthUser, type OrganizationDetails } from '@/lib/api-client';

export function WorkspaceDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [details, setDetails] = useState<OrganizationDetails | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false); const [projectSearch, setProjectSearch] = useState(''); const [projectSort, setProjectSort] = useState<'updated' | 'name'>('updated');

  async function loadOrganizations(preferredId?: string) {
    const [me, list] = await Promise.all([apiClient.auth.me(), apiClient.organizations.list()]);
    if (me.success && me.data) setUser(me.data);
    if (!list.success || !list.data) { setError(list.error?.message || 'Could not load your organizations.'); setLoading(false); return; }
    const stored = preferredId || window.localStorage.getItem('versionflow_organization_id') || '';
    const nextId = list.data.some((item) => item.organization.id === stored) ? stored : list.data[0]?.organization.id || '';
    setSelectedId(nextId);
    if (nextId) await loadDetails(nextId);
    setLoading(false);
  }

  async function loadDetails(id: string) {
    setError('');
    const result = await apiClient.organizations.details(id);
    if (!result.success || !result.data) { setError(result.error?.message || 'Could not load this organization.'); return; }
    window.localStorage.setItem('versionflow_organization_id', id);
    window.dispatchEvent(new CustomEvent('versionflow:organization-changed', { detail: result.data.organization.name }));
    setDetails(result.data);
  }

  useEffect(() => { void loadOrganizations(); const handleOrganizationChange = () => { setDetails(null); void loadOrganizations(window.localStorage.getItem('versionflow_organization_id') || undefined); }; window.addEventListener('versionflow:organization-changed', handleOrganizationChange); return () => window.removeEventListener('versionflow:organization-changed', handleOrganizationChange); }, []);

  async function createProject(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!selectedId || !projectName.trim()) return; setBusy(true); setError(''); const result = await apiClient.projects.create(selectedId, { name: projectName.trim(), description: projectDescription.trim() || undefined }); setBusy(false); if (!result.success) { setError(result.error?.message || 'Could not create the project.'); return; } setProjectName(''); setProjectDescription(''); await loadDetails(selectedId); }

  if (loading) return <div className="data-state" role="status">Loading your workspace…</div>;
  return <div className="workspace-page">
    <div className="welcome-row"><div><p className="page-kicker">Authenticated workspace</p><h2>Welcome, {user?.name || 'developer'}.</h2><p className="page-subtitle">Choose an organization, then open a project to manage its API registry.</p></div></div>
    {error && <div className="data-alert" role="alert">{error}</div>}
    {details && <section className="workspace-section"><div className="section-title-row"><div><p className="page-kicker">{details.organization.type} organization</p><h3>{details.organization.name}</h3><p>{details.members.length} member{details.members.length === 1 ? '' : 's'} · {details.projects.length} project{details.projects.length === 1 ? '' : 's'}</p></div><Users size={18}/></div>
      <div className="project-toolbar"><label htmlFor="project-search">Search projects<input id="project-search" value={projectSearch} onChange={(event) => setProjectSearch(event.target.value)} placeholder="Search by name or description"/></label><label htmlFor="project-sort">Sort<select id="project-sort" value={projectSort} onChange={(event) => setProjectSort(event.target.value as 'updated' | 'name')}><option value="updated">Recently updated</option><option value="name">Name</option></select></label></div>
      {details.projects.filter((project) => `${project.name} ${project.description || ''}`.toLowerCase().includes(projectSearch.toLowerCase())).sort((a, b) => projectSort === 'name' ? a.name.localeCompare(b.name) : b.updatedAt.localeCompare(a.updatedAt)).length ? <div className="project-grid">{details.projects.filter((project) => `${project.name} ${project.description || ''}`.toLowerCase().includes(projectSearch.toLowerCase())).sort((a, b) => projectSort === 'name' ? a.name.localeCompare(b.name) : b.updatedAt.localeCompare(a.updatedAt)).map((project) => <Link href={`/dashboard/projects/${project.id}`} className="project-card" key={project.id}><span className="project-icon"><FolderKanban size={18}/></span><div><b>{project.name}</b><p>{project.description || 'No project description yet.'}</p><div className="project-card-metrics"><span>{project.apiCount || 0} APIs</span><span>{project.versionCount || 0} versions</span><span>{project.dependencyCount || 0} dependencies</span></div><small>Updated {new Date(project.updatedAt).toLocaleDateString()}</small></div><ArrowRight size={16}/></Link>)}</div> : <div className="empty-state"><FolderKanban size={22}/><b>{details.projects.length ? 'No projects match your search' : 'No projects in this organization'}</b><p>{details.projects.length ? 'Try a different project name or description.' : 'Create the first project to start registering APIs.'}</p></div>}
      <form className="project-create" onSubmit={createProject} noValidate><div><label htmlFor="project-name">Project name</label><input id="project-name" value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Payments Platform" required/></div><div><label htmlFor="project-description">Description</label><input id="project-description" value={projectDescription} onChange={(event) => setProjectDescription(event.target.value)} placeholder="APIs owned by the payments team"/></div><button disabled={busy || !projectName.trim()}><Plus size={15}/> Create project</button></form>
    </section>}
  </div>;
}
