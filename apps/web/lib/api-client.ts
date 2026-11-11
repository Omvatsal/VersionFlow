import { ApiResponse, SystemHealth } from '@versionflow/contracts';

export type AuthUser = { id: string; name: string; email: string };
export type AuthTokens = { accessToken: string; refreshToken: string; tokenType: 'Bearer' };
export type Organization = { id: string; name: string; slug: string; type: 'personal' | 'team'; createdAt: string; updatedAt: string };
export type OrganizationListItem = { organization: Organization; role: 'owner' | 'admin' | 'member' };
export type Project = { id: string; organizationId: string; name: string; slug: string; description?: string | null; createdAt: string; updatedAt: string; apiCount?: number; versionCount?: number; dependencyCount?: number };
export type ProjectMember = { collaborator: { id: string; projectId: string; userId: string; role: 'admin' | 'editor' | 'viewer'; createdAt: string; updatedAt: string }; user: AuthUser };
export type ProjectSettings = { project: Project; organization: { id: string; name: string }; currentUserRole: 'admin' | 'editor' | 'viewer'; canManage: boolean };
export type OrganizationDetails = { organization: Organization; members: Array<{ membership: { role: string }; user: AuthUser }>; projects: Project[] };
export type ApiRecord = { id: string; projectId: string; name: string; slug: string; description?: string | null; lifecycle: 'draft' | 'active' | 'deprecated' | 'sunset'; createdAt: string; updatedAt: string };
export type ApiVersion = { id: string; apiId: string; version: string; status: 'draft' | 'published' | 'deprecated' | 'sunset'; specificationFormat: string; sourceSpecificationVersion?: string | null; publishedAt?: string | null; deprecatedAt?: string | null; sunsetAt?: string | null; createdAt: string; updatedAt: string };
export type ApiEndpoint = { id: string; apiVersionId: string; method: string; path: string; operationId?: string | null; summary?: string | null; parameters?: unknown; requestSchema?: unknown; responseSchema?: unknown; security?: unknown; expectedStatusCodes?: unknown };
export type Dependency = { dependency: { id: string; sourceApiVersionId: string; targetApiVersionId?: string | null; targetApiId?: string | null; dependencyType: string; relationship: string; reviewStatus: string; description?: string | null; evidence?: string | null }; sourceVersion: ApiVersion; sourceApi: ApiRecord };
export type DependencyGraph = { nodes: Array<{ id: string; name: string; description?: string | null; protocol: string; lifecycle: ApiRecord['lifecycle']; latestVersion: string | null; endpointCount: number; versionCount: number }>; edges: Array<{ id: string; sourceApiId: string; targetApiId: string; relationship: string; dependencyType: string; reviewStatus: string; sourceVersion: string | null; targetVersion: string | null; sourceEndpointId?: string | null; targetEndpointId?: string | null; description?: string | null; evidence?: string | null; createdAt: string; metadata: { direction: string; changedAt: string } }>; summary: { nodeCount: number; edgeCount: number; isolatedApiCount: number; highestOutgoing: Array<{ apiId: string; name: string; count: number }>; highestIncoming: Array<{ apiId: string; name: string; count: number }> } };
export type ApiContract = { snapshot: { id: string; apiVersionId: string; originalFilename?: string | null; specificationFormat: string; sourceSpecificationVersion?: string | null; checksum: string; originalDocument?: string | null; normalizedContract: unknown; createdAt: string }; version: ApiVersion; api: ApiRecord; endpoints: ApiEndpoint[] };
export type AnalyticsOverview = { metrics: { apis: number; versions: number; endpoints: number; dependencies: number }; lifecycle: Array<{ lifecycle: string; value: number }>; growth: Array<{ date: string; value: number }>; activity: Array<{ id: string; eventType: string; summary: string; occurredAt: string }> };
export type EnrichedImpactFinding = ApiImpactFinding & { changedApiName: string; dependentApiName: string; sourceVersion: string | null; targetVersion: string | null; changeType: string; changeCategory: string; contractPath: string | null; relationship: string | null; affectedEndpoint: ApiEndpoint | null };
export type ImpactAnalytics = { summary: { impactedApis: number; directApis: number; transitiveApis: number; highRiskFindings: number; affectedEndpoints: number; openFindings: number }; apis: ApiRecord[]; changes: ApiChange[]; findings: EnrichedImpactFinding[]; dependencies: Array<{ id: string; sourceApiVersionId: string; targetApiVersionId?: string | null; targetApiId?: string | null; relationship: string; sourceEndpointId?: string | null; targetEndpointId?: string | null; evidence?: string | null }>; severity: Array<{ name: string; count: number }>; timeSeries: Array<{ date: string; critical: number; high: number; medium: number; low: number; informational: number }>; apiRisk: Array<{ apiId: string; name: string; findings: number; upstreamApis: number; relationships: number; affectedEndpoints: number; highestSeverity: string }>; categorySeverity: Array<{ category: string; values: Record<string, number> }>; depth: Array<{ depth: number; label: string; uniqueApis: number; paths: number }>; matrix: Array<{ upstreamApiId: string; upstreamApiName: string; dependentApiId: string; dependentApiName: string; count: number; highestSeverity: string; findings: EnrichedImpactFinding[] }>; statusHistory: Array<{ id: string; findingId: string; fromStatus: string | null; toStatus: string; note?: string | null; occurredAt: string }> };

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl ||
      (typeof process !== 'undefined' && process.env['NEXT_PUBLIC_API_URL']) ||
      'http://localhost:4000/api/v1';
  }

  private async request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    try {
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(typeof window !== 'undefined' && window.localStorage.getItem('versionflow_access_token')
            ? { Authorization: `Bearer ${window.localStorage.getItem('versionflow_access_token')}` }
            : {}),
          ...options?.headers,
        },
        ...options,
      });

      const body = await response.json() as ApiResponse<T> | T | { message?: string | string[]; error?: string };

      if (!response.ok) {
        const apiError = body as { error?: { code?: string; message?: string } | string; message?: string | string[] };
        const message = Array.isArray(apiError.message) ? apiError.message.join(', ') : apiError.message || (typeof apiError.error === 'string' ? apiError.error : apiError.error?.message) || `Request failed with status ${response.status}`;
        return { success: false, error: { code: typeof apiError.error === 'object' ? apiError.error?.code || 'HTTP_ERROR' : 'HTTP_ERROR', message } };
      }

      if (typeof body === 'object' && body !== null && 'success' in body) return body as ApiResponse<T>;
      return { success: true, data: body as T };
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : 'Unknown network error';
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message,
        },
      };
    }
  }

  readonly health = {
    getSystemHealth: async (): Promise<ApiResponse<SystemHealth>> => {
      return this.request<SystemHealth>('/health');
    },
    getLiveness: async (): Promise<ApiResponse<{ status: string }>> => {
      return this.request<{ status: string }>('/health/liveness');
    },
    getReadiness: async (): Promise<ApiResponse<{ status: string }>> => {
      return this.request<{ status: string }>('/health/readiness');
    },
  };

  readonly auth = {
    login: (input: { email: string; password: string }) => this.request<{ user: AuthUser; tokens: AuthTokens }>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
    register: (input: { name: string; email: string; password: string }) => this.request<{ user: AuthUser; organization: { id: string; name: string }; tokens: AuthTokens }>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
    me: () => this.request<AuthUser>('/auth/me'),
    logout: () => this.request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  };

  readonly organizations = {
    list: () => this.request<OrganizationListItem[]>('/organizations'),
    details: (id: string) => this.request<OrganizationDetails>(`/organizations/${id}`),
    create: (input: { name: string }) => this.request<Organization>('/organizations', { method: 'POST', body: JSON.stringify(input) }),
  };

  readonly projects = {
    get: (id: string) => this.request<{ project: Project; collaborators: Array<{ collaborator: { role: string }; user: AuthUser }> }>(`/projects/${id}`),
    create: (organizationId: string, input: { name: string; description?: string }) => this.request<Project>(`/projects/organization/${organizationId}`, { method: 'POST', body: JSON.stringify(input) }),
    settings: (id: string) => this.request<ProjectSettings>(`/projects/${id}/settings`),
    updateSettings: (id: string, input: { name: string; description?: string | null; slug?: string }) => this.request<Project>(`/projects/${id}/settings`, { method: 'PATCH', body: JSON.stringify(input) }),
    members: (id: string) => this.request<{ members: ProjectMember[]; currentUserRole: ProjectMember['collaborator']['role']; canManage: boolean }>(`/projects/${id}/members`),
    eligibleMembers: (id: string) => this.request<ProjectMember[]>(`/projects/${id}/members/eligible`),
    addMember: (id: string, input: { userId: string; role: ProjectMember['collaborator']['role'] }) => this.request<ProjectMember['collaborator']>(`/projects/${id}/collaborators`, { method: 'POST', body: JSON.stringify(input) }),
    updateMember: (id: string, userId: string, role: ProjectMember['collaborator']['role']) => this.request<ProjectMember['collaborator']>(`/projects/${id}/members/${userId}`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    removeMember: (id: string, userId: string) => this.request<{ deleted: boolean }>(`/projects/${id}/members/${userId}`, { method: 'DELETE' }),
  };

  readonly registry = {
    list: (projectId: string) => this.request<ApiRecord[]>(`/projects/${projectId}/apis`),
    create: (projectId: string, input: { name: string; description?: string; baseUrl?: string; protocol?: string; documentationUrl?: string; tags?: string[] }) => this.request<ApiRecord>(`/projects/${projectId}/apis`, { method: 'POST', body: JSON.stringify(input) }),
    versions: (projectId: string, apiId: string) => this.request<ApiVersion[]>(`/projects/${projectId}/apis/${apiId}/versions`),
    createVersion: (projectId: string, apiId: string, input: { version: string; specification?: string; specificationFormat?: string }) => this.request<ApiVersion>(`/projects/${projectId}/apis/${apiId}/versions`, { method: 'POST', body: JSON.stringify(input) }),
    endpoints: (projectId: string, apiId: string, versionId: string) => this.request<ApiEndpoint[]>(`/projects/${projectId}/apis/${apiId}/versions/${versionId}/endpoints`),
    contract: (projectId: string, apiId: string, versionId: string) => this.request<ApiContract>(`/projects/${projectId}/apis/${apiId}/versions/${versionId}/contract`),
    createEndpoint: (projectId: string, apiId: string, versionId: string, input: Partial<ApiEndpoint> & { method: string; path: string }) => this.request<ApiEndpoint>(`/projects/${projectId}/apis/${apiId}/versions/${versionId}/endpoints`, { method: 'POST', body: JSON.stringify(input) }),
  };

  readonly imports = {
    preview: (projectId: string, input: { filename: string; content: string }) => this.request<{ import: { id: string }; specification: { title: string; description?: string; apiVersion: string; format: string; operations: Array<{ name: string; method: string; path: string; description?: string; validationStatus: string; expectedStatusCodes?: string[] }> } }>(`/projects/${projectId}/apis/imports/preview`, { method: 'POST', body: JSON.stringify(input) }),
    register: (projectId: string, input: { importId: string; selectedOperations?: number[]; apiName?: string; apiSlug?: string; apiVersion?: string }) => this.request<{ registeredOperations: number }>(`/projects/${projectId}/apis/imports/register`, { method: 'POST', body: JSON.stringify(input) }),
  };

  readonly dependencies = {
    list: (projectId: string) => this.request<Dependency[]>(`/projects/${projectId}/dependencies`),
    graph: (projectId: string) => this.request<DependencyGraph>(`/projects/${projectId}/dependencies/graph`),
    create: (projectId: string, input: { sourceApiVersionId: string; targetApiVersionId?: string; targetApiId?: string; dependencyType: 'internal' | 'external'; relationship: string; description?: string; evidence?: string; reviewStatus?: 'pending' | 'confirmed' | 'rejected' }) => this.request<Dependency['dependency']>(`/projects/${projectId}/dependencies`, { method: 'POST', body: JSON.stringify(input) }),
    remove: (projectId: string, dependencyId: string) => this.request<{ deleted: boolean }>(`/projects/${projectId}/dependencies/${dependencyId}`, { method: 'DELETE' }),
  };
  readonly analytics = {
    overview: (projectId: string) => this.request<AnalyticsOverview>(`/projects/${projectId}/analytics/overview`),
    apis: (projectId: string) => this.request<Array<{ api: ApiRecord; versions: number }>>(`/projects/${projectId}/analytics/apis`),
    versions: (projectId: string) => this.request<Array<{ version: ApiVersion; api: ApiRecord; endpoints: number }>>(`/projects/${projectId}/analytics/versions`),
    dependencies: (projectId: string) => this.request<Dependency[]>(`/projects/${projectId}/analytics/dependencies`),
    impact: (projectId: string) => this.request<{ available: boolean; changes: ApiChange[]; findings: ApiImpactFinding[]; summary: { totalChanges: number; breakingChanges: number; potentiallyBreaking: number; openFindings: number } }>(`/projects/${projectId}/analytics/impact`),
  };
  readonly changes = {
    analytics: (projectId: string) => this.request<ImpactAnalytics>(`/projects/${projectId}/changes/analytics`),
  };
}

export type ApiChange = { id: string; projectId: string; apiId: string; sourceVersionId: string; targetVersionId: string; category: string; changeType: string; contractPath: string; classification: string; severity: string; explanation: string; reviewStatus: string; detectedAt: string };
export type ApiImpactFinding = { id: string; projectId: string; changeId: string; dependencyId: string | null; changedApiId: string; dependentApiId: string; dependentVersionId: string | null; affectedEndpointId?: string | null; impact: string; propagationDepth: number; severity: string; confidence: string; status: string; evidence: string; explanation: string; detectedAt: string };

export const apiClient = new ApiClient();

