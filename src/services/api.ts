import axios, { type AxiosInstance } from 'axios';
import type {
  PromptRequest,
  PromptResponse,
  TaskStatus,
  ParameterOptions,
  QuotaResponse,
  UserProfile,
  UsageHistory,
  UsageStats,
  HealthCheck,
  ApiError
} from '../types/api';

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private handleApiError(error: unknown): ApiError {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { detail?: string }; status?: number } };
      if (axiosError.response?.data) {
        return {
          detail: axiosError.response.data.detail || 'An error occurred',
          status: axiosError.response.status || 0,
        };
      }
    }
    const errorMessage = error && typeof error === 'object' && 'message' in error 
      ? (error as { message: string }).message 
      : 'Network error';
    return {
      detail: errorMessage,
      status: 0,
    };
  }

  // Authentication methods
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // API endpoints
  async generatePrompt(request: PromptRequest): Promise<PromptResponse> {
    const response = await this.api.post<PromptResponse>('/generate-prompt', request);
    return response.data;
  }

  async generatePromptAsync(request: PromptRequest): Promise<{ task_id: string; status: string }> {
    const response = await this.api.post<{ task_id: string; status: string }>(
      '/generate-prompt/async',
      request
    );
    return response.data;
  }

  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const response = await this.api.get<TaskStatus>(`/task/${taskId}`);
    return response.data;
  }

  async getParameterOptions(): Promise<ParameterOptions> {
    const response = await this.api.get<ParameterOptions>('/parameters/options');
    return response.data;
  }

  async getUserProfile(): Promise<UserProfile> {
    const response = await this.api.get<UserProfile>('/auth/me');
    return response.data;
  }

  async getUserQuota(): Promise<QuotaResponse> {
    const response = await this.api.get<QuotaResponse>('/auth/quota');
    return response.data;
  }

  async getQuotaUsage(limit: number = 50): Promise<UsageHistory> {
    const response = await this.api.get<UsageHistory>(`/auth/quota/usage?limit=${limit}`);
    return response.data;
  }

  async getUsageStats(): Promise<UsageStats> {
    const response = await this.api.get<UsageStats>('/stats');
    return response.data;
  }

  async getHealthCheck(): Promise<HealthCheck> {
    const response = await this.api.get<HealthCheck>('/health');
    return response.data;
  }

  async getRoot(): Promise<Record<string, unknown>> {
    const response = await this.api.get('/');
    return response.data;
  }

  // Helper method for polling async tasks
  async pollTaskStatus(
    taskId: string,
    onUpdate: (status: TaskStatus) => void,
    onComplete: (status: TaskStatus) => void,
    onError: (error: ApiError) => void,
    intervalMs: number = 2000
  ) {
    const poll = async () => {
      try {
        const status = await this.getTaskStatus(taskId);
        onUpdate(status);

        if (status.status === 'completed' || status.status === 'failed') {
          onComplete(status);
          return;
        }

        setTimeout(poll, intervalMs);
      } catch (error) {
        onError(error as ApiError);
      }
    };

    poll();
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Re-export types for convenience
export * from '../types/api';