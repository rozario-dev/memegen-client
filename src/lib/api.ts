import axios, { type AxiosInstance } from 'axios';
import type {
  PromptRequest,
  PromptResponse,
  TaskStatus,
  ParameterOptions,
  QuotaResponse,
  UserProfile,
  ApiError,
  DirectMultipleImageGenerationRequest,
  ImageModifyRequest,
  DirectImageGenerationResponse,
  ImageHistoryResponse,
  ImageItem,
  PaymentCreateResponse,
  PaymentRecord
} from './types';

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
      timeout: 180000,
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
      const axiosError = error as { response?: { data?: { message?: string; detail?: string; error?: boolean }; status?: number } };
      if (axiosError.response?.data) {
        const errorMessage = axiosError.response.data.message || axiosError.response.data.detail || 'An error occurred';
        return {
          detail: errorMessage,
          status: axiosError.response.status || 0,
          message: errorMessage,
        };
      }
    }
    const errorMessage = error && typeof error === 'object' && 'message' in error 
      ? (error as { message: string }).message 
      : 'Network error';
    return {
      detail: errorMessage,
      status: 0,
      message: errorMessage
    };
  }

  // Authentication methods
  setToken(token: string, persist: boolean = true) {
    this.token = token;
    if (persist) {
      localStorage.setItem('auth_token', token);
    } else {
      // ensure no stale token lingers in localStorage when using non-persistent session
      localStorage.removeItem('auth_token');
    }
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
      const response = await this.api.post<PromptResponse>('/images/generate-prompt', request);
      return response.data;
    } catch (error) {
      console.error('API request failed:', error);
      // Check if it's a network error (backend not running)
      if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'ECONNREFUSED') {
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
    const response = await this.api.get<TaskStatus>(`/images/task/${taskId}`);
    return response.data;
  }

  async getParameterOptions(): Promise<ParameterOptions> {
    try {
      const response = await this.api.get<ParameterOptions>('/images/parameters/options');
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

  // Payments
  async createPayment(amountUsd: number, payCurrency: string, orderDescription?: string, ipnCallbackUrl?: string): Promise<PaymentCreateResponse> {
    const payload: Record<string, unknown> = {
      amount_usd: amountUsd,
      pay_currency: payCurrency,
    };
    if (orderDescription) payload.order_description = orderDescription;
    if (ipnCallbackUrl) payload.ipn_callback_url = ipnCallbackUrl;
    else payload.ipn_callback_url = import.meta.env.VITE_NOWPAYMENT_IPN_CALLBACK_URL;
    const response = await this.api.post<PaymentCreateResponse>('/payments/create', payload);
    return response.data;
  }

  async getPaymentRecords(limit: number = 50, offset?: number): Promise<PaymentRecord[]> {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (typeof offset === 'number' && offset >= 0) params.set('offset', String(offset));
    const response = await this.api.get<PaymentRecord[]>(`/payments/records?${params.toString()}`);
    return response.data;
  }

  // Cancel a payment by payment_id
  async cancelPayment(paymentId: number): Promise<{ success: boolean; message: string; payment_id?: number; payment_status?: string }> {
    const response = await this.api.post('/payments/cancel', { payment_id: paymentId });
    const data: any = response.data;
    // Normalize shape: backend may return {ok, message, payment_id} or {success, message, ...}
    const success = typeof data?.success !== 'undefined' ? Boolean(data.success) : Boolean(data?.ok);
    const message = data?.message ?? (success ? 'Canceled' : 'Cancel failed');
    const payment_id = typeof data?.payment_id === 'number' ? data.payment_id : paymentId;
    const payment_status = typeof data?.payment_status === 'string' ? data.payment_status : undefined;
    return { success, message, payment_id, payment_status };
  }

  // async getQuotaUsage(limit: number = 50): Promise<UsageHistory> {
  //   const response = await this.api.get<UsageHistory>(`/auth/quota/usage?limit=${limit}`);
  //   return response.data;
  // }

  // async getUsageStats(): Promise<UsageStats> {
  //   const response = await this.api.get<UsageStats>('/images/stats');
  //   return response.data;
  // }

  // async getHealthCheck(): Promise<HealthCheck> {
  //   const response = await this.api.get<HealthCheck>('/health');
  //   return response.data;
  // }

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

  async modifyImage(request: ImageModifyRequest): Promise<ImageItem> {
    try {
      // Debug log for outgoing payload
      // console.log('[ApiService] POST /images/modify seed_images:', request.seed_images);
      const response = await this.api.post('/images/modify', request);
      return response.data.data || response.data;
    } catch (error) {
      throw error;
    }
  }

  async getImageHistory(limit?: number, offset?: number): Promise<ImageHistoryResponse> {
    try {
      const params = new URLSearchParams();
      if (typeof limit === 'number') params.set('limit', String(limit));
      if (typeof offset === 'number') params.set('offset', String(offset));
      const response = await this.api.get(`/auth/image-history?${params.toString()}`);
      return response.data.data || response.data;
    } catch (error) {
      throw error;
    }
  }

  async authenticateWithSolana(_publicKey: string, _signature: string, _message: string): Promise<{ token: string; user: UserProfile }> {
    // TODO: Implement real authentication via backend endpoint
    // Keeping the same interface for future integration
    return {
      token: 'dev-token-placeholder',
      user: {
        id: 'solana-user-dev',
        email: 'solana@dev.local',
        quota: {
          user_id: 'solana-user-dev',
          total_quota: 0,
          used_quota: 0,
          remaining_quota: 0,
        },
      }
    };
  }

  async pollTaskStatus(
    taskId: string,
    onUpdate: (status: TaskStatus) => void,
    onComplete: (status: TaskStatus) => void,
    onError: (error: ApiError) => void,
    intervalMs: number = 2000
  ) {
    let timer: number | undefined;
    const stop = () => {
      if (timer) window.clearInterval(timer);
    };

    try {
      const initial = await this.getTaskStatus(taskId);
      onUpdate(initial);
      if (initial.status === 'completed' || initial.status === 'failed') {
        onComplete(initial);
        return stop();
      }

      timer = window.setInterval(async () => {
        try {
          const status = await this.getTaskStatus(taskId);
          onUpdate(status);
          if (status.status === 'completed' || status.status === 'failed') {
            onComplete(status);
            stop();
          }
        } catch (err) {
          onError(this.handleApiError(err));
          stop();
        }
      }, intervalMs);
    } catch (err) {
      onError(this.handleApiError(err));
      stop();
    }
  }
}

export const apiService = new ApiService();
export * from './types';