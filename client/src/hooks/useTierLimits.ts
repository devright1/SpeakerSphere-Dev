import { useQuery } from '@tanstack/react-query';
import type { TierLimit } from '@shared/schema';

export function useTierLimits() {
  return useQuery<TierLimit[]>({
    queryKey: ['/api/tier-limits'],
  });
}

export function useTierLimit(tier: 'basic' | 'pro' | 'premier') {
  return useQuery<TierLimit>({
    queryKey: ['/api/tier-limits', tier],
    enabled: !!tier,
  });
}

export function getTierLimitValue(limits: TierLimit | undefined, limitType: 'bioWordLimit' | 'topicLimit' | 'uploadLimit'): number | null {
  if (!limits) return null;
  return limits[limitType];
}

export function isWithinLimit(currentValue: number, limit: number | null): boolean {
  if (limit === null) return true;
  return currentValue <= limit;
}

export function isNearLimit(currentValue: number, limit: number | null, threshold: number = 0.9): boolean {
  if (limit === null) return false;
  return currentValue >= limit * threshold && currentValue < limit;
}

export function getUsagePercentage(currentValue: number, limit: number | null): number | null {
  if (limit === null) return null;
  return Math.min((currentValue / limit) * 100, 100);
}

export function formatTierLimit(tierLimits: TierLimit[] | undefined, tier: string, limitType: 'bioWordLimit' | 'topicLimit' | 'uploadLimit' | 'storageLimitMb' | 'maxFileSizeMb'): string {
  if (!tierLimits) return '';
  const tierData = tierLimits.find(t => t.tier === tier);
  if (!tierData) return '';
  
  const value = tierData[limitType];
  if (limitType === 'topicLimit') {
    if (value === null) return 'Unlimited topics';
    return `Up to ${value} topics`;
  }
  if (limitType === 'bioWordLimit') {
    if (value === null) return '';
    return `${value}-word bio`;
  }
  if (limitType === 'uploadLimit') {
    if (value === null) return '';
    return value === 1 ? '1 upload' : `${value} uploads`;
  }
  if (limitType === 'storageLimitMb') {
    if (value === null) return '';
    return value >= 1000 ? `${value / 1000} GB storage` : `${value} MB storage`;
  }
  if (limitType === 'maxFileSizeMb') {
    if (value === null) return '';
    return `${value} MB max file size`;
  }
  return '';
}
