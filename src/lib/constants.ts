export const USER_TIERS = {
  FREE: 'free',
  DEV: 'dev',
  PRO: 'pro',
  MAX: 'max',
} as const;

export type UserTier = typeof USER_TIERS[keyof typeof USER_TIERS];

type UserTierMap<T> = Record<UserTier, T>;

export const CREDIT_COSTS: UserTierMap<number> = {
  free: 1,
  dev: 5,
  pro: 25,
  max: 40,
};

export const USER_TIER_LABELS: UserTierMap<string> = {
  free: 'Free',
  dev: 'Dev',
  pro: 'Pro',
  max: 'Max',
};

export const USER_TIER_DESCRIPTIONS: UserTierMap<string> = {
  free: 'Free tier, suitable for personal use',
  dev: 'Developer tier, higher quality',
  pro: 'Professional tier, best quality',
  max: 'Top tier, ultimate quality',
};

export type { UserTier as UserTierType } from '../lib/constants';