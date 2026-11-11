'use client';

import { FormEvent, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ChevronDown, Search } from 'lucide-react';
import { apiClient, type AuthUser, type OrganizationListItem } from '@/lib/api-client';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [orgOpen, setOrgOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationListItem[]>([]);
  const [organizationName, setOrganizationName] = useState('Select organization');
  const [newOrgName, setNewOrgName] = useState('');
  const [orgError, setOrgError] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const inProject = pathname.includes('/projects/');
  const current = inProject ? 'Project workspace' : 'Projects';
  const initials = user?.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'VF';

  useEffect(() => {
    const handleOrganizationChange = (event: Event) => setOrganizationName((event as CustomEvent<string>).detail);
    window.addEventListener('versionflow:organization-changed', handleOrganizationChange);
    void Promise.all([apiClient.auth.me(), apiClient.organizations.list()]).then(([me, list]) => {
      if (!me.success || !me.data) { router.replace('/auth/login'); return; }
      setUser(me.data);
      if (!list.success || !list.data) return;
      setOrganizations(list.data);
      const stored = window.localStorage.getItem('versionflow_organization_id');
      const selected = list.data.find((item) => item.organization.id === stored) || list.data[0];
      if (selected) setOrganizationName(selected.organization.name);
    });
    return () => window.removeEventListener('versionflow:organization-changed', handleOrganizationChange);
  }, [router, pathname]);

  function selectOrganization(item: OrganizationListItem) {
    window.localStorage.setItem('versionflow_organization_id', item.organization.id);
    setOrganizationName(item.organization.name);
    setOrgOpen(false);
    window.dispatchEvent(new CustomEvent('versionflow:organization-changed', { detail: item.organization.name }));
    if (inProject) router.push('/dashboard');
  }

  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newOrgName.trim()) return;
    setOrgError('');
    const result = await apiClient.organizations.create({ name: newOrgName.trim() });
    if (!result.success || !result.data) { setOrgError(result.error?.message || 'Could not create organization.'); return; }
    setNewOrgName('');
    const item: OrganizationListItem = { organization: result.data, role: 'owner' };
    setOrganizations((currentList) => [...currentList, item]);
    selectOrganization(item);
    router.push('/dashboard');
  }

  return <div className="app-shell"><div className="app-main">
    <header className="app-topbar"><div className="topbar-context"><div className="org-selector-wrap">
      <button className="org-selector" onClick={() => setOrgOpen((value) => !value)} aria-expanded={orgOpen} aria-haspopup="menu"><span className="workspace-avatar">{organizationName[0]?.toUpperCase() || 'O'}</span><span><small>Organization</small><b>{organizationName}</b></span><ChevronDown size={14}/></button>
      {orgOpen && <div className="org-menu" role="menu"><p>Switch organization</p>{organizations.map((item) => <button type="button" role="menuitem" key={item.organization.id} className={item.organization.name === organizationName ? 'selected' : ''} onClick={() => selectOrganization(item)}><span><b>{item.organization.name}</b><small>{item.organization.type} · {item.role}</small></span><span>{item.organization.name === organizationName ? 'Current' : 'Open'}</span></button>)}<form onSubmit={createOrganization} className="org-create" noValidate><input aria-label="New organization name" value={newOrgName} onChange={(event) => setNewOrgName(event.target.value)} placeholder="New organization"/><button disabled={!newOrgName.trim()} type="submit"><span>+</span> Create organization</button>{orgError && <small className="org-error">{orgError}</small>}</form></div>}
    </div><div><span className="top-kicker">VersionFlow / <b>{current}</b></span><h1>{current}</h1></div></div><div className="top-actions"><label className="app-search"><Search size={15}/><input aria-label="Search workspace" placeholder="Search workspace"/></label><button className="icon-button notification" aria-label="Notifications"><Bell size={18}/></button><span className="top-avatar">{initials}</span></div></header>
    <main className={`app-content ${inProject ? 'project-app-content' : ''}`}>{children}</main>
  </div></div>;
}
