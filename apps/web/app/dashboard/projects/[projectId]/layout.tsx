import { ProjectWorkspaceLayout } from '@/components/project-workspace-layout';
export default async function ProjectLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ projectId: string }> }>) { const { projectId } = await params; return <ProjectWorkspaceLayout projectId={projectId}>{children}</ProjectWorkspaceLayout>; }
