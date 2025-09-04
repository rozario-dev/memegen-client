export const USER_TIERS = {
  FREE: 'free',
  DEV: 'dev',
  PRO: 'pro',
  MAX: 'max',
} as const;

export type UserTier = typeof USER_TIERS[keyof typeof USER_TIERS];

type UserTierMap<T> = Partial<Record<UserTier, T>>;

export const CREDIT_COSTS: UserTierMap<number> = {
  free: 1,
  dev: 5,
  pro: 25,
  // max: 40,
};

export const TIER_CONFIT: UserTierMap<string> = {
  free: '🆓',
  dev: '⚡', 
  pro: '💎',
  // max: '🚀'
}

export const USER_TIER_LABELS: UserTierMap<string> = {
  free: 'Free',
  dev: 'Dev',
  pro: 'Pro',
  // max: 'Max',
};

// export const USER_TIER_LABELS_MODIFY: UserTierMap<string> = {
//   free: 'Free',
//   dev: 'Dev',
//   pro: 'Pro',
// };

export const USER_TIER_DESCRIPTIONS: UserTierMap<string> = {
  free: 'FLUX.1 schnell dev',
  dev: 'FLUX.1 krae dev,  Qwen Image, HiDream-I1',
  pro: 'Gemini Nano Banana',
  // max: 'Ideogram 3.0',
};

export const USER_TIER_DESCRIPTIONS_MODIFY: UserTierMap<string> = {
  free: 'FLUX.1 kontext dev',
  dev: 'Qwen Image Edit', // support multi reference images
  pro: 'Gemini Nano Banana', // support multi reference images
};

export const SUPPORT_MULTI_REFERENCE_IMAGES: UserTierMap<boolean> = {
  free: false,
  dev: false,
  pro: true,
  // max: false,
};

export type { UserTier as UserTierType } from '../lib/constants';

export const DEFAULT_USER_TIER = USER_TIERS.DEV;

export const STYLES = [
  {
    "id": 1,
    "name": "Flat Design",
    "name_cn": "扁平风格",
    "description": "Simple color blocks and shapes without 3D effects, suitable for modern logo design"
  },
  {
    "id": 2,
    "name": "Line Art",
    "name_cn": "线条艺术",
    "description": "Uses lines as the main element with minimal color filling, simple yet elegant"
  },
  {
    "id": 3,
    "name": "American Cartoon",
    "name_cn": "美式卡通",
    "description": "Exaggerated expressions and movements with bright colors, full of energy"
  },
  {
    "id": 4,
    "name": "Anime Style",
    "name_cn": "日系动漫风格",
    "description": "Large eyes and delicate expressions, popular in Asian markets"
  },
  {
    "id": 5,
    "name": "3D Cartoon",
    "name_cn": "3D卡通",
    "description": "3D modeling with bright colors and modern feel"
  },
  {
    "id": 6,
    "name": "Watercolor",
    "name_cn": "水彩风格",
    "description": "Soft gradients and textures with strong artistic sense"
  },
  {
    "id": 7,
    "name": "Pixel Art",
    "name_cn": "像素风格",
    "description": "Composed of pixels, retro gaming style"
  },
  {
    "id": 8,
    "name": "Doodle Style",
    "name_cn": "涂鸦风格",
    "description": "Hand-drawn sketch feeling, casual and fun"
  },
  {
    "id": 9,
    "name": "Vintage Cartoon",
    "name_cn": "复古卡通",
    "description": "Aged color tones, classic animation style"
  },
  {
    "id": 10,
    "name": "Claymation",
    "name_cn": "黏土动画风格",
    "description": "Imitates clay material with handmade texture"
  },
  {
    "id": 11,
    "name": "Ghibli Style",
    "name_cn": "吉卜力风格",
    "description": "Hand-painted watercolor textures, soft natural lighting, detailed backgrounds, and emotionally expressive characters with nostalgic warmth"
  },
  {
    "id": 12,
    "name": "Collectible Figure",
    "name_cn": "手办风格",
    "description": "Highly detailed collectible figure appearance with realistic textures, precise sculpting details, and premium finish quality"
  },
  {
    "id": 13,
    "name": "Geometric Cartoon",
    "name_cn": "几何卡通",
    "description": "Uses geometric shapes to construct characters, modern and concise"
  },
  {
    "id": 14,
    "name": "Gradient Style",
    "name_cn": "渐变风格",
    "description": "Rich color gradients with strong visual impact"
  },
  {
    "id": 15,
    "name": "Hand-Drawn",
    "name_cn": "手绘风格",
    "description": "Imitates hand-drawn effects, natural and亲切"
  },
  {
    "id": 16,
    "name": "Corporate Mascot",
    "name_cn": "企业吉祥物风格",
    "description": "Professional and friendly character design suitable for brand representation"
  },
  {
    "id": 17,
    "name": "Cyberpunk Cartoon",
    "name_cn": "赛博朋克卡通",
    "description": "Futuristic with neon colors and tech elements"
  },
  {
    "id": 18,
    "name": "Minimalist Cartoon",
    "name_cn": "极简卡通",
    "description": "Extremely simplified while retaining core features"
  },
  {
    "id": 19,
    "name": "Sticker Style",
    "name_cn": "贴纸风格",
    "description": "Imitates sticker effect with white outlines and bright colors"
  },
  {
    "id": 20,
    "name": "Gradient Mesh",
    "name_cn": "渐变网格风格",
    "description": "Complex color gradients with delicate visual effects"
  }
]