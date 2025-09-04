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

// export const USER_TIER_DESCRIPTIONS_MODIFY: UserTierMap<string> = {
//   free: 'FLUX.1 kontext dev',
//   dev: 'Qwen Image Edit', // support multi reference images
//   pro: 'Gemini Nano Banana', // support multi reference images
// };

export const SUPPORT_MULTI_REFERENCE_IMAGES: UserTierMap<boolean> = {
  free: false,
  dev: false,
  pro: true,
  // max: false,
};

export type { UserTier as UserTierType } from '../lib/constants';

export const DEFAULT_USER_TIER = USER_TIERS.DEV;