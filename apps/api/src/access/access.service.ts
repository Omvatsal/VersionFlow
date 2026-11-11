import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { getDatabaseConnection, organizationMemberships, organizations, projectCollaborators, projects } from '@versionflow/database';
@Injectable()
export class AccessService {
  private db() { return getDatabaseConnection().db; }
  async membership(userId: string, organizationId: string) { const [row] = await this.db().select({ membership: organizationMemberships, organization: organizations }).from(organizationMemberships).innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id)).where(and(eq(organizationMemberships.organizationId, organizationId), eq(organizationMemberships.userId, userId))).limit(1); if (!row) throw new ForbiddenException('You are not a member of this organization'); return row; }
  async projectAccess(userId: string, projectId: string, minimum: 'viewer' | 'editor' | 'admin' = 'viewer') { const [row] = await this.db().select({ project: projects, collaborator: projectCollaborators }).from(projects).innerJoin(projectCollaborators, eq(projectCollaborators.projectId, projects.id)).where(and(eq(projects.id, projectId), eq(projectCollaborators.userId, userId))).limit(1); if (!row) throw new NotFoundException('Project not found or access denied'); const rank = { viewer: 1, editor: 2, admin: 3 }; if (rank[row.collaborator.role] < rank[minimum]) throw new ForbiddenException('Insufficient project permissions'); return row; }
}
