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
