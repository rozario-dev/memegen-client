export interface PromptRequest {
  user_input: string;
  aspect_ratio: AspectRatio;
  image_format: ImageFormat;
  style_preference?: string;
}

export interface PromptResponse {
  id: string;
  user_input: string;
  generated_prompt: string;
  parameters: {
    aspect_ratio: string;
    image_format: string;
    style_preference?: string;
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
  aspect_ratios: string[];
  image_formats: string[];
  descriptions: {
    aspect_ratios: Record<string, string>;
    image_formats: Record<string, string>;
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

export const AspectRatio = {
  SQUARE: '1:1',
  ULTRA_WIDE: '21:9',
  WIDE: '16:9',
  STANDARD_LANDSCAPE: '4:3',
  CLASSIC_LANDSCAPE: '3:2',
  CLASSIC_PORTRAIT: '2:3',
  STANDARD_PORTRAIT: '3:4',
  TALL_PORTRAIT: '9:16',
  ULTRA_TALL: '9:21'
} as const;

export type AspectRatio = typeof AspectRatio[keyof typeof AspectRatio];

export const ImageFormat = {
  PNG: 'png',
  JPG: 'jpg',
  WEBP: 'webp'
} as const;

export type ImageFormat = typeof ImageFormat[keyof typeof ImageFormat];

export interface ApiError {
  detail: string;
  status?: number;
  message?: string;
}

// Image Generation Types
import type { UserTier } from './constants';

// 删除这里原有的：
// export const UserTier = { FREE:'free', DEV:'dev', PRO:'pro', MAX:'max' } as const;
// export type UserTier = typeof UserTier[keyof typeof UserTier];

export interface DirectMultipleImageGenerationRequest {
  user_input: string;
  user_tier?: UserTier;
  count?: number;
  aspect_ratio?: AspectRatio;
  image_format?: ImageFormat;
  style_preference?: string;
  negative_prompt?: string;
  steps?: number;
  cfg_scale?: number;
  seed?: number;
}

export interface DirectImageGenerationResponse {
  prompt_id: string;
  user_input: string;
  generated_prompt: string;
  images: ImageItem[];
  total_images: number;
  user_tier: string;
  credits_consumed: number;
  remaining_credits: number;
}

// 图片修改接口
export interface ImageModifyRequest {
  prompt: string;
  seed_images: string[];
  user_tier?: UserTier;
  strength?: number;
  aspect_ratio?: AspectRatio;
  image_format?: ImageFormat;
  negative_prompt?: string;
  steps?: number;
  cfg_scale?: number;
  seed?: number;
}

// export interface ImageModifyResponse {
//   aspect_ratio: AspectRatio;
//   cfg_scale: number;
//   created_at: string;
//   credits_consumed: number;
//   generation_time: number;

//   image_url: string;
//   image_uuid: string;
//   cost: number;
//   model_name: string;
//   seed: number;
// }

// 图片历史记录相关类型
export interface ImageItem {
  seed: number;
  model: string;
  steps: number;
  width: number;
  height: number;
  cfg_scale: number;
  image_url: string;
  created_at: string;
  image_uuid: string;
  model_name: string;
  generation_time: number;
  user_tier?: string;
}

// export interface ImageModifyResponse {
//   aspect_ratio: AspectRatio;
//   cfg_scale: number;
//   created_at: string;
//   credits_consumed: number;
//   generation_time: number;
//   image_url: string;
//   image_uuid: string;
//   cost: number;
//   model_name: string;
//   seed: number;
// }

export interface ModifiedImage {
  id: string;
  imageUrl: string;
  prompt?: string;
  timestamp: Date;
  isOriginal?: boolean;
  modelName?: string;
  createdAt?: string;
  userTier?: string;
}

export interface HistoryRecord {
  id: string;
  request_id: string;
  operation_type: string;
  prompt: string;
  negative_prompt: string | null;
  user_tier: string;
  aspect_ratio: string;
  image_format: string;
  strength: number | null;
  seed_images: string[] | null;
  count: number;
  credits_consumed: number;
  remaining_credits: number;
  generation_time: number;
  status: string;
  error_message: string | null;
  images: ImageItem[];
  created_at: string;
}

export interface ImageHistoryResponse {
  user_id: string;
  total_count: number;
  history: HistoryRecord[];
}