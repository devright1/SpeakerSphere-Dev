import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { HardDrive, Video, TrendingUp, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StorageUsageProps {
  storageUsedBytes: number;
  storageUsedFormatted: string;
  maxStorageBytes: number;
  maxStorageFormatted: string;
  videoCount: number;
  maxVideos: number;
  maxVideosFormatted: string;
  tier: string;
  storagePercentage: number;
  videosPercentage: number;
}

export default function StorageUsage({
  storageUsedFormatted,
  maxStorageFormatted,
  videoCount,
  maxVideosFormatted,
  tier,
  storagePercentage,
  videosPercentage,
  maxVideos
}: StorageUsageProps) {
  const isNearingStorageLimit = storagePercentage >= 80;
  const isNearingVideoLimit = maxVideos !== -1 && videosPercentage >= 80;
  const shouldShowUpgrade = (tier === "basic" || tier === "pro") && (isNearingStorageLimit || isNearingVideoLimit);

  return (
    <Card data-testid="card-storage-usage">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Usage
            </CardTitle>
            <CardDescription>Track your video storage and upload limits</CardDescription>
          </div>
          {tier === "basic" ? (
            <Badge variant="secondary" data-testid="badge-tier">Basic</Badge>
          ) : tier === "pro" ? (
            <Badge className="bg-blue-500 hover:bg-blue-600" data-testid="badge-tier">Pro</Badge>
          ) : (
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600" data-testid="badge-tier">
              <Crown className="h-3 w-3 mr-1" />
              Premier
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Storage Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Storage
            </span>
            <span className="text-muted-foreground" data-testid="text-storage-usage">
              {storageUsedFormatted} / {maxStorageFormatted}
            </span>
          </div>
          <Progress 
            value={Math.min(storagePercentage, 100)} 
            className="h-2"
            data-testid="progress-storage"
          />
          {isNearingStorageLimit && (
            <p className="text-xs text-orange-600 dark:text-orange-400" data-testid="text-storage-warning">
              You're using {Math.round(storagePercentage)}% of your storage limit
            </p>
          )}
        </div>

        {/* Video Count Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium flex items-center gap-2">
              <Video className="h-4 w-4" />
              Videos
            </span>
            <span className="text-muted-foreground" data-testid="text-video-count">
              {videoCount} / {maxVideosFormatted}
            </span>
          </div>
          {maxVideos !== -1 ? (
            <>
              <Progress 
                value={Math.min(videosPercentage, 100)} 
                className="h-2"
                data-testid="progress-videos"
              />
              {isNearingVideoLimit && (
                <p className="text-xs text-orange-600 dark:text-orange-400" data-testid="text-video-warning">
                  You've uploaded {videoCount} of {maxVideos} videos
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <TrendingUp className="h-4 w-4" />
              <span>Unlimited videos</span>
            </div>
          )}
        </div>

        {/* Upgrade CTA */}
        {shouldShowUpgrade && (
          <div className="pt-4 border-t">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">
                    {tier === "basic" ? "Upgrade for More Storage" : "Nearing Your Storage Limit"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {tier === "basic" 
                      ? "Pro offers 5GB and 10 videos. Premier offers 20GB and unlimited videos."
                      : "Upgrade to Premier for 20GB storage and unlimited videos"
                    }
                  </p>
                </div>
              </div>
              <Link href="/subscription/upgrade">
                <Button size="sm" className="w-full" data-testid="button-upgrade">
                  <Crown className="h-4 w-4 mr-2" />
                  {tier === "basic" ? "View Upgrade Options" : "Upgrade to Premier"}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Tier Benefits Summary */}
        <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
          {tier === "basic" && (
            <p>Basic: 500 MB storage, 3 videos</p>
          )}
          {tier === "pro" && (
            <p>Pro: 5 GB storage, 10 videos, featured placement</p>
          )}
          {tier === "premier" && (
            <p>Premier: 20 GB storage, unlimited videos, top placement</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
