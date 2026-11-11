import { DashboardPlaceholder } from '@/components/dashboard-placeholder';
import { ProjectDashboard } from '@/components/project-dashboard';
import { SpecificationImport } from '@/components/specification-import';
import { DependencyRegistry } from '@/components/dependency-registry';
import { ManualApiRegistration } from '@/components/manual-api-registration';
import { DependencyGraph } from '@/components/dependency-graph';
import { VersionTimeline } from '@/components/version-timeline';
import { ChangeIntelligence } from '@/components/change-intelligence';
import { BreakingDependencies } from '@/components/breaking-dependencies';
import { ProjectSettings } from '@/components/project-settings';
import { ProjectMembers } from '@/components/project-members';

export default async function ProjectSectionPage({ params }: { params: Promise<{ projectId: string; section: string[] }> }) {
  const { projectId, section } = await params;
  if (section.join('/') === 'apis') return <ProjectDashboard projectId={projectId}/>;
  if (section.join('/') === 'apis/import') return <SpecificationImport projectId={projectId}/>;
  if (section.join('/') === 'dependencies') return <DependencyRegistry projectId={projectId}/>;
  if (section.join('/') === 'dependencies/graph') return <DependencyGraph projectId={projectId}/>;
  if (section.join('/') === 'apis/manual') return <ManualApiRegistration projectId={projectId}/>;
  if (section.join('/') === 'versions') return <VersionTimeline projectId={projectId}/>;
  if (section.join('/') === 'analysis/impact') return <ChangeIntelligence projectId={projectId}/>;
  if (section.join('/') === 'analysis/breaking') return <BreakingDependencies projectId={projectId}/>;
  if (section.join('/') === 'settings') return <ProjectSettings projectId={projectId}/>;
  if (section.join('/') === 'members') return <ProjectMembers projectId={projectId}/>;
  const labels: Record<string, [string, string]> = { 'apis/import': ['Import specifications', 'XML specification import is planned for the next implementation milestone.'], 'apis/manual': ['Manual API registration', 'The API registry currently provides registration from the project dashboard. A dedicated workflow will follow.'], versions: ['API versions', 'Version history is stored by the backend and a dedicated version management view is planned next.'], 'dependencies/graph': ['Dependency graph', 'Dependency visualization is available from this project workspace.'], dependencies: ['Dependency registry', 'Dependency management is planned for the next implementation milestone.'], 'dependencies/add': ['Add dependency', 'Dependency creation is not implemented yet.'], 'analysis/history': ['Version history', 'Version history UI is not implemented yet.'], 'integrations/github': ['GitHub repositories', 'GitHub integration is not implemented yet.'] };
  const [title, description] = labels[section.join('/')] || ['Project workspace', 'This project workspace destination is not implemented yet.'];
  return <DashboardPlaceholder title={title} label="Project workspace" description={description}/>;
}
