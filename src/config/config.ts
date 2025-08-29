// Credit consumption configuration for different user tiers
export const CREDIT_COSTS = {
  free: 1,
  dev: 5,
  pro: 25,
  max: 40
} as const;

export type UserTierType = keyof typeof CREDIT_COSTS;

// User tier display names
export const USER_TIER_LABELS = {
  free: 'Free',
  dev: 'Developer',
  pro: 'Professional',
  max: 'Maximum'
} as const;

// User tier descriptions
export const USER_TIER_DESCRIPTIONS = {
  free: 'Free tier, suitable for personal use',
  dev: 'Developer tier, higher quality',
  pro: 'Professional tier, best quality',
  max: 'Top tier, ultimate quality'
} as const;