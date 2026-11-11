import { ProjectAnalytics } from '@/components/project-analytics';
export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) { const { projectId } = await params; return <ProjectAnalytics projectId={projectId}/>; }
