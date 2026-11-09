import { ApiResponse, SystemHealth } from '@versionflow/contracts';

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
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      const json = (await response.json()) as ApiResponse<T>;

      if (!response.ok && !json.error) {
        throw new ApiClientError(
          `Request failed with status ${response.status}`,
          response.status,
          'HTTP_ERROR',
        );
      }

      return json;
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
}

export const apiClient = new ApiClient();

