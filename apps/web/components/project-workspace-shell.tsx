'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Box, ChevronRight, GitBranch, GitCompareArrows, LayoutDashboard, Network, Settings, Users } from 'lucide-react';

const groups = [
  { label: 'Overview', items: [['', 'Project dashboard', LayoutDashboard]] },
  { label: 'API management', items: [['apis', 'API registry', GitBranch], ['apis/import', 'Import specifications', Box], ['apis/manual', 'Manual API registration', GitBranch], ['versions', 'API versions', GitCompareArrows]] },
  { label: 'Dependency intelligence', items: [['dependencies/graph', 'Dependency graph', Network], ['dependencies', 'Dependency registry', Network], ['dependencies/add', 'Add dependency', Box]] },
  { label: 'Analysis', items: [['analysis/impact', 'Change impact analysis', Activity], ['analysis/breaking', 'Breaking change detection', Activity], ['analysis/history', 'Version history', Activity]] },
  { label: 'Integrations', items: [['integrations/github', 'GitHub repositories', GitBranch]] },
  { label: 'Settings', items: [['settings', 'Project settings', Settings], ['members', 'Members & access', Users]] },
] as const;

export function ProjectWorkspaceShell({ projectId, projectName, children }: { projectId: string; projectName: string; children: React.ReactNode }) {
  const pathname = usePathname(); const root = `/dashboard/projects/${projectId}`;
  return <div className="project-workspace-shell"><aside className="project-sidebar"><ProjectNav root={root} pathname={pathname} projectName={projectName}/></aside><details className="project-sidebar-mobile"><summary>Project navigation · {projectName}</summary><ProjectNav root={root} pathname={pathname} projectName={projectName}/></details><main className="project-workspace-content"><div className="workspace-breadcrumb"><Link href="/dashboard">Organizations</Link><ChevronRight size={12}/><b>{projectName}</b></div>{children}</main></div>;
}

function ProjectNav({ root, pathname, projectName }: { root: string; pathname: string; projectName: string }) { return <><div className="project-sidebar-header"><small>Project workspace</small><b>{projectName}</b></div>{groups.map((group) => <div className="project-sidebar-group" key={group.label}><p>{group.label}</p>{group.items.map(([path, label, Icon]) => { const href = path ? `${root}/${path}` : root; const active = path ? pathname === href : pathname === root; return <Link href={href} className={active ? 'active' : ''} key={path || 'overview'}><Icon size={14}/><span>{label}</span></Link>; })}</div>)}</>; }
