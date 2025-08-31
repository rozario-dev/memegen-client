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
  ImageGenerationRequest,
  MultipleImageGenerationRequest,
  ImageGenerationResponse,
  MultipleImageGenerationResponse,
  DirectImageGenerationRequest,
  DirectMultipleImageGenerationRequest,
  DirectImageGenerationResponse,
  DirectMultipleImageGenerationResponse,
  ImageModifyRequest,
  ImageModifyResponse
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
    console.log('Sending request to /generate-prompt:', request);
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
          // shapes: {
          //   circle: 'Circular logo format, perfect for social media profiles',
          //   square: 'Square format, ideal for most social platforms',
          //   rectangle: 'Rectangular format for banners and headers',
          //   hexagon: 'Hexagonal shape for unique geometric designs',
          //   diamond: 'Diamond shape for premium and luxury feel'
          // },
          // text_options: {
          //   no_text: 'Pure visual design without any text elements',
          //   with_text: 'Include text elements in the design',
          //   minimal_text: 'Subtle text integration with focus on visuals'
          // },
          aspect_ratios: {
            '1:1': 'Square format - perfect for Instagram posts and profile pictures',
            '16:9': 'Widescreen format - ideal for YouTube thumbnails and banners',
            '4:3': 'Standard landscape - great for presentations',
            '3:2': 'Classic photo ratio - balanced composition',
            '2:3': 'Portrait orientation - good for mobile displays',
            '3:4': 'Tall portrait - perfect for Instagram stories',
            '9:16': 'Vertical format - optimized for mobile viewing'
          },
          image_formats: {
            png: 'PNG format with transparency support - best for logos',
            jpg: 'JPEG format - smaller file size, good for photos',
            webp: 'WebP format - modern format with excellent compression'
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

  // Image Generation endpoints
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    console.log('API: Sending image generation request to /images/generate:', request);
    try {
      const response = await this.api.post<ImageGenerationResponse>('/images/generate', request);
      console.log('API: Received image generation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Image generation request failed:', error);
      throw error;
    }
  }

  async generateMultipleImages(request: MultipleImageGenerationRequest): Promise<MultipleImageGenerationResponse> {
    const response = await this.api.post<MultipleImageGenerationResponse>('/images/generate-multiple', request);
    return response.data;
  }

  // 新的直接生成图片方法
  async generateImageDirect(request: DirectImageGenerationRequest): Promise<DirectImageGenerationResponse> {
    console.log('发送直接图片生成请求:', request);
    try {
      const response = await this.api.post('/images/generate-image', request);
      console.log('收到直接图片生成响应:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('直接图片生成失败:', error);
      throw error;
    }
  }

  async generateMultipleImagesDirect(request: DirectMultipleImageGenerationRequest): Promise<DirectMultipleImageGenerationResponse> {
    console.log('发送直接多图片生成请求:', request);
    try {
      const response = await this.api.post('/images/generate-images', request);
      console.log('收到直接多图片生成响应:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('直接多图片生成失败:', error);
      throw error;
    }
  }

  async modifyImage(request: ImageModifyRequest): Promise<ImageModifyResponse> {
    console.log('发送图片修改请求:', request);
    try {
      const response = await this.api.post('/images/modify', request);
      console.log('收到图片修改响应:', response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.error('图片修改失败:', error);
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