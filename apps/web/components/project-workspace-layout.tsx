'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { ProjectWorkspaceShell } from './project-workspace-shell';
export function ProjectWorkspaceLayout({ children, projectId }: { children: React.ReactNode; projectId: string }) {
  const [projectName, setProjectName] = useState('Project');
  useEffect(() => { void apiClient.projects.get(projectId).then((result) => { if (result.success && result.data) setProjectName(result.data.project.name); }); }, [projectId]);
  return <ProjectWorkspaceShell projectId={projectId} projectName={projectName}>{children}</ProjectWorkspaceShell>;
}
