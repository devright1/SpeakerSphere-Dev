export const STORAGE_LIMITS = {
  basic: {
    maxStorageBytes: 500 * 1024 * 1024, // 500MB
    maxVideos: 3,
    displayName: "Basic",
    displayStorage: "500 MB",
    displayVideos: "3 videos"
  },
  pro: {
    maxStorageBytes: 5 * 1024 * 1024 * 1024, // 5GB
    maxVideos: 10,
    displayName: "Pro",
    displayStorage: "5 GB",
    displayVideos: "10 videos"
  },
  premier: {
    maxStorageBytes: 20 * 1024 * 1024 * 1024, // 20GB
    maxVideos: -1, // -1 indicates unlimited
    displayName: "Premier",
    displayStorage: "20 GB",
    displayVideos: "Unlimited"
  }
} as const;

export type SubscriptionTier = keyof typeof STORAGE_LIMITS;

export function getStorageLimits(tier: string) {
  const normalizedTier = tier.toLowerCase() as SubscriptionTier;
  return STORAGE_LIMITS[normalizedTier] || STORAGE_LIMITS.basic;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function canUploadVideo(
  currentStorageBytes: number,
  currentVideoCount: number,
  newVideoSizeBytes: number,
  tier: string
): { allowed: boolean; reason?: string } {
  const limits = getStorageLimits(tier);
  
  // Check video count limit (unless unlimited)
  if (limits.maxVideos !== -1 && currentVideoCount >= limits.maxVideos) {
    return {
      allowed: false,
      reason: `You've reached your ${limits.displayVideos} limit. Upgrade to upload more videos.`
    };
  }
  
  // Check storage limit
  const newTotalStorage = currentStorageBytes + newVideoSizeBytes;
  if (newTotalStorage > limits.maxStorageBytes) {
    return {
      allowed: false,
      reason: `This upload would exceed your ${limits.displayStorage} storage limit. Upgrade for more storage.`
    };
  }
  
  return { allowed: true };
}
