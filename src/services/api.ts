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
  ApiError,
  DirectMultipleImageGenerationRequest,
  ImageModifyRequest,
  ImageModifyResponse,
  DirectImageGenerationResponse,
  ImageHistoryResponse
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
    try {
      const response = await this.api.post<PromptResponse>('/generate-prompt', request);
      console.log('Received response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API request failed:', error);
      // Check if it's a network error (backend not running)
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ECONNREFUSED') {
        throw new Error('Backend service is not running. Please start the API server.');
      }
      throw error;
    }
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
    try {
      const response = await this.api.get<ParameterOptions>('/parameters/options');
      return response.data;
    } catch (error) {
      // Fallback to mock data when backend is not available
      console.warn('Backend API not available, using mock parameter options');
      return {
        // shapes: ['circle', 'square', 'rectangle', 'hexagon', 'diamond'],
        // text_options: ['no_text', 'with_text', 'minimal_text'],
        aspect_ratios: ['1:1', '16:9', '4:3', '3:2', '2:3', '3:4', '9:16'],
        image_formats: ['png', 'jpg', 'webp'],
        descriptions: {
          aspect_ratios: {
            '1:1': 'Square - perfect for Instagram posts and profile pictures',
            '16:9': 'Widescreen - ideal for YouTube thumbnails and banners',
            '4:3': 'Standard - great for presentations',
            '3:2': 'Classic - balanced composition',
            '2:3': 'Portrait - good for mobile displays',
            '3:4': 'Tall - perfect for Instagram stories',
            '9:16': 'Vertical - optimized for mobile viewing'
          },
          image_formats: {
            png: 'PNG - transparent images, best for logos',
            jpg: 'JPEG - smaller file size, good for photos',
            webp: 'WebP - modern format with excellent compression'
          }
        }
      };
    }
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

  async generateMultipleImagesDirect(request: DirectMultipleImageGenerationRequest): Promise<DirectImageGenerationResponse> {
    try {
      const response = await this.api.post('/images/generate-combined-images', request);
      return response.data.data || response.data;
    } catch (error) {
      throw error;
    }
  }

  async generateMultipleImagesDirectAsync(request: DirectMultipleImageGenerationRequest): Promise<{ task_id: string; status: string }> {
    const response = await this.api.post<{ task_id: string; status: string }>(
      '/images/generate-combined-images/async',
      request
    );
    return response.data;
  }

  async modifyImage(request: ImageModifyRequest): Promise<ImageModifyResponse> {
    try {
      const response = await this.api.post('/images/modify', request);
      console.log('收到图片修改响应:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      throw error;
    }
  }

  async getImageHistory(limit?: number, offset?: number): Promise<ImageHistoryResponse> {
    try {
      const params = new URLSearchParams();
      if (limit !== undefined) {
        params.append('limit', limit.toString());
      }
      if (offset !== undefined) {
        params.append('offset', offset.toString());
      }
      
      const url = `/auth/image-history${params.toString() ? '?' + params.toString() : ''}`;
      const response = await this.api.get<ImageHistoryResponse>(url);
      console.log('收到图片历史记录响应:', response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Solana authentication (using custom token approach)
  // Note: This method is no longer needed as we use custom token generation
  // Keeping for potential future backend integration
  async authenticateWithSolana(publicKey: string, signature: string, message: string): Promise<{ token: string; user: UserProfile }> {
    // This endpoint doesn't exist yet - would need backend implementation
    throw new Error('Solana backend authentication not implemented. Using custom token approach instead.');
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