export interface PromptRequest {
  user_input: string;
  shape: ShapeType;
  text_option: TextOption;
  quality: QualityOption;
  style_preference?: string;
  background_preference?: string;
}

export interface PromptResponse {
  id: string;
  user_input: string;
  generated_prompt: string;
  parameters: {
    shape: string;
    text_option: string;
    quality: string;
    style_preference?: string;
    background_preference?: string;
  };
  created_at: string;
  status: string;
}

export interface TaskStatus {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface ParameterOptions {
  shapes: string[];
  text_options: string[];
  quality_options: string[];
  descriptions: {
    shapes: Record<string, string>;
    text_options: Record<string, string>;
    quality_options: Record<string, string>;
  };
}

export interface QuotaResponse {
  user_id: string;
  total_quota: number;
  used_quota: number;
  remaining_quota: number;
  subscription_plan?: string;
  reset_date: string;
}

export interface UserProfile {
  id: string;
  email: string;
  quota: QuotaResponse;
  created_at: string;
}

export interface QuotaUsage {
  id: string;
  prompt_input: string;
  used_at: string;
  quota_deducted: number;
}

export interface UsageHistory {
  user_id: string;
  usage: QuotaUsage[];
}

export interface UsageStats {
  total_prompts: number;
  successful_prompts: number;
  failed_prompts: number;
  average_response_time: number;
  daily_usage: Record<string, number>;
  top_user_inputs: string[];
  popular_parameters: Record<string, unknown>;
}

export interface HealthCheck {
  status: string;
  timestamp: string;
  version: string;
  services: Record<string, string | number>;
}

export const ShapeType = {
  CIRCLE: 'circle',
  SQUARE: 'square',
  RECTANGLE: 'rectangle',
  HEXAGON: 'hexagon',
  DIAMOND: 'diamond',
  CUSTOM: 'custom'
} as const;

export type ShapeType = typeof ShapeType[keyof typeof ShapeType];

export const TextOption = {
  NO_TEXT: 'no_text',
  WITH_TEXT: 'with_text',
  MINIMAL_TEXT: 'minimal_text'
} as const;

export type TextOption = typeof TextOption[keyof typeof TextOption];

export const QualityOption = {
  ULTRA_HD: '8K',
  HIGH_HD: '4K',
  FULL_HD: '1080p',
  HD: '720p',
  STANDARD: '480p'
} as const;

export type QualityOption = typeof QualityOption[keyof typeof QualityOption];

export interface ApiError {
  detail: string;
  status?: number;
}