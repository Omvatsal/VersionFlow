'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut, Menu, Search, X } from 'lucide-react';
import { apiClient, type AuthUser, type OrganizationListItem } from '@/lib/api-client';
import { projectNavigationGroups } from './project-workspace-shell';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [orgOpen, setOrgOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationListItem[]>([]);
  const [organizationName, setOrganizationName] = useState('Select organization');
  const [newOrgName, setNewOrgName] = useState('');
  const [orgError, setOrgError] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const inProject = pathname.includes('/projects/');
  const projectId = inProject ? pathname.split('/')[3] : undefined;
  const current = inProject ? 'Project workspace' : 'Projects';
  const initials = user?.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'VF';

  useEffect(() => {
    if (!profileOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) setProfileOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setProfileOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileNavOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavOpen]);

  useEffect(() => {
    const handleOrganizationChange = (event: Event) => setOrganizationName((event as CustomEvent<string>).detail);
    window.addEventListener('versionflow:organization-changed', handleOrganizationChange);
    void Promise.all([apiClient.auth.me(), apiClient.organizations.list()]).then(([me, list]) => {
      if (!me.success || !me.data) { router.replace('/auth/login'); return; }
      setUser(me.data);
      if (!list.success || !list.data) return;
      const organizationList: OrganizationListItem[] = list.data;
      setOrganizations(organizationList);
      const stored = window.localStorage.getItem('versionflow_organization_id');
      const selected = organizationList.find((item: OrganizationListItem) => item.organization.id === stored) || organizationList[0];
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

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    const accessToken = window.localStorage.getItem('versionflow_access_token');
    window.localStorage.removeItem('versionflow_access_token');
    window.localStorage.removeItem('versionflow_refresh_token');
    try {
      await apiClient.auth.logout(accessToken || undefined);
    } finally {
      router.replace('/auth/login');
      router.refresh();
    }
  }

  return <div className="app-shell"><div className="app-main">
    <header className="app-topbar"><div className="topbar-context"><button type="button" className="mobile-menu-button" aria-label={mobileNavOpen ? 'Close workspace navigation' : 'Open workspace navigation'} aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((value) => !value)}>{mobileNavOpen ? <X size={19}/> : <Menu size={19}/>}</button><div className="org-selector-wrap">
      <button className="org-selector" onClick={() => setOrgOpen((value) => !value)} aria-expanded={orgOpen} aria-haspopup="menu"><span className="workspace-avatar">{organizationName[0]?.toUpperCase() || 'O'}</span><span><small>Organization</small><b>{organizationName}</b></span><ChevronDown size={14}/></button>
      {orgOpen && <div className="org-menu" role="menu"><p>Switch organization</p>{organizations.map((item) => <button type="button" role="menuitem" key={item.organization.id} className={item.organization.name === organizationName ? 'selected' : ''} onClick={() => selectOrganization(item)}><span><b>{item.organization.name}</b><small>{item.organization.type} · {item.role}</small></span><span>{item.organization.name === organizationName ? 'Current' : 'Open'}</span></button>)}<form onSubmit={createOrganization} className="org-create" noValidate><input aria-label="New organization name" value={newOrgName} onChange={(event) => setNewOrgName(event.target.value)} placeholder="New organization"/><button disabled={!newOrgName.trim()} type="submit"><span>+</span> Create organization</button>{orgError && <small className="org-error">{orgError}</small>}</form></div>}
    </div><div><span className="top-kicker">VersionFlow / <b>{current}</b></span><h1>{current}</h1></div></div><div className="top-actions"><label className="app-search"><Search size={15}/><input aria-label="Search workspace" placeholder="Search workspace"/></label><button className="icon-button notification" aria-label="Notifications"><Bell size={18}/></button><div className="profile-menu-wrap" ref={profileMenuRef}><button type="button" className="top-avatar profile-trigger" aria-label={user ? `Open account menu for ${user.name}` : 'Open account menu'} aria-expanded={profileOpen} aria-haspopup="menu" onClick={() => setProfileOpen((value) => !value)}>{initials}</button>{profileOpen && <div className="profile-menu" role="menu"><div className="profile-summary"><span className="profile-menu-avatar">{initials}</span><span><b>{user?.name || 'VersionFlow user'}</b><small>{user?.email || 'Authenticated workspace'}</small></span></div><div className="profile-menu-divider"/><button type="button" role="menuitem" className="profile-signout" onClick={() => void signOut()} disabled={signingOut} aria-busy={signingOut}><LogOut size={15}/><span>{signingOut ? 'Signing out…' : 'Sign out'}</span></button></div>}</div></div></header>
    {mobileNavOpen && <><button type="button" className="mobile-nav-backdrop" aria-label="Close workspace navigation" onClick={() => setMobileNavOpen(false)}/><nav className="mobile-nav" aria-label="Workspace navigation"><p className="mobile-nav-kicker">VersionFlow</p><Link href="/dashboard" className={!inProject ? 'active' : ''} onClick={() => setMobileNavOpen(false)}><span>Workspace</span><small>Organizations and projects</small></Link>{inProject && projectId && <div className="mobile-project-navigation"><p className="mobile-nav-kicker">{organizationName} / project</p>{projectNavigationGroups.map((group) => <div className="mobile-nav-group" key={group.label}><p>{group.label}</p>{group.items.map(([path, label, Icon]) => { const href = path ? `/dashboard/projects/${projectId}/${path}` : `/dashboard/projects/${projectId}`; const active = path ? pathname === href : pathname === `/dashboard/projects/${projectId}`; return <Link href={href} className={active ? 'active' : ''} key={path || 'overview'} onClick={() => setMobileNavOpen(false)}><Icon size={16}/><span>{label}</span></Link>; })}</div>)}</div>}</nav></>}
    <main className={`app-content ${inProject ? 'project-app-content' : ''}`}>{children}</main>
  </div></div>;
}
