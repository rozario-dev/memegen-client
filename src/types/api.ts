export interface PromptRequest {
  user_input: string;
  // shape: ShapeType;
  // text_option: TextOption;
  aspect_ratio: AspectRatio;
  image_format: ImageFormat;
  style_preference?: string;
  background_preference?: string;
}

export interface PromptResponse {
  id: string;
  user_input: string;
  generated_prompt: string;
  parameters: {
    // shape: string;
    // text_option: string;
    aspect_ratio: string;
    image_format: string;
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
  // shapes: string[];
  // text_options: string[];
  aspect_ratios: string[];
  image_formats: string[];
  descriptions: {
    // shapes: Record<string, string>;
    // text_options: Record<string, string>;
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

// export const ShapeType = {
//   CIRCLE: 'circle',
//   SQUARE: 'square',
//   RECTANGLE: 'rectangle',
//   HEXAGON: 'hexagon',
//   DIAMOND: 'diamond',
//   CUSTOM: 'custom'
// } as const;

// export type ShapeType = typeof ShapeType[keyof typeof ShapeType];

// export const TextOption = {
//   NO_TEXT: 'no_text',
//   WITH_TEXT: 'with_text',
//   MINIMAL_TEXT: 'minimal_text'
// } as const;

// export type TextOption = typeof TextOption[keyof typeof TextOption];

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
}

// Image Generation Types
export const UserTier = {
  FREE: 'free',
  DEV: 'dev',
  PRO: 'pro',
  MAX: 'max'
} as const;

export type UserTier = typeof UserTier[keyof typeof UserTier];

export interface ImageGenerationRequest {
  prompt: string;
  user_tier?: UserTier;
  // shape?: ShapeType;
  aspect_ratio?: AspectRatio;
  image_format?: ImageFormat;
  negative_prompt?: string;
  steps?: number;
  cfg_scale?: number;
  seed?: number;
}

export interface MultipleImageGenerationRequest {
  prompt: string;
  user_tier?: UserTier;
  count?: number;
  // shape?: ShapeType;
  aspect_ratio?: AspectRatio;
  image_format?: ImageFormat;
  negative_prompt?: string;
  steps?: number;
  cfg_scale?: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  seed?: number;
}

export interface ImageGenerationResponse {
  image_url: string;
  image_uuid: string;
  prompt: string;
  negative_prompt?: string;
  model: string;
  model_name: string;
  user_tier: string;
  credits_consumed: number;
  remaining_credits: number;
  width: number;
  height: number;
  steps: number;
  cfg_scale: number;
  seed: number;
  generation_time: number;
  created_at: string;
  // shape: string;
  aspect_ratio: string;
  image_format: string;
}

export interface MultipleImageGenerationResponse {
  images: {
    image_url: string;
    image_uuid: string;
    prompt: string;
    negative_prompt?: string;
    model: string;
    model_name: string;
    user_tier: string;
    credits_consumed: number;
    remaining_credits: number;
    width: number;
    height: number;
    steps: number;
    cfg_scale: number;
    seed: number;
    generation_time: number;
    created_at: string;
    // shape: string;
    aspect_ratio: string;
    image_format: string;
  }[];
  total_credits_consumed: number;
  total_generation_time: number;
}

// 新的直接生成图片接口
export interface DirectImageGenerationRequest {
  user_input: string;
  user_tier?: UserTier;
  count?: number;
  // shape?: ShapeType;
  aspect_ratio?: AspectRatio;
  image_format?: ImageFormat;
  style_preference?: string;
  background_preference?: string;
  // text_option?: TextOption;
  negative_prompt?: string;
  steps?: number;
  cfg_scale?: number;
  seed?: number;
}

export interface DirectMultipleImageGenerationRequest {
  user_input: string;
  user_tier?: UserTier;
  count?: number;
  // shape?: ShapeType;
  aspect_ratio?: AspectRatio;
  image_format?: ImageFormat;
  style_preference?: string;
  background_preference?: string;
  // text_option?: TextOption;
  negative_prompt?: string;
  steps?: number;
  cfg_scale?: number;
}

export interface DirectImageGenerationResponse {
  prompt_id: string;
  user_input: string;
  generated_prompt: string;
  images: {
    image_url: string;
    image_uuid: string;
    width: number;
    height: number;
    seed: number;
    model: string;
    model_name: string;
    steps: number;
    cfg_scale: number;
    generation_time: number;
    created_at: string;
    isModified?: boolean;
  }[];
  total_images: number;
  user_tier: string;
  credits_consumed: number;
  remaining_credits: number;
}

export interface DirectMultipleImageGenerationResponse {
  prompt_id: string;
  user_input: string;
  generated_prompt: string;
  images: {
    image_url: string;
    image_uuid: string;
    width: number;
    height: number;
    seed: number;
    model: string;
    model_name: string;
    steps: number;
    cfg_scale: number;
    generation_time: number;
    created_at: string;
  }[];
  total_images: number;
  user_tier: string;
  credits_consumed: number;
  remaining_credits: number;
}

// 图片修改接口
export interface ImageModifyRequest {
  prompt: string;
  seed_image: string;
  user_tier?: UserTier;
  strength?: number;
  // shape?: ShapeType;
  aspect_ratio?: AspectRatio;
  image_format?: ImageFormat;
  negative_prompt?: string;
  steps?: number;
  cfg_scale?: number;
  seed?: number;
}

export interface ImageModifyResponse {
  image_url: string;
  image_uuid: string;
  cost: number;
  model_name: string;
  seed: number;
}