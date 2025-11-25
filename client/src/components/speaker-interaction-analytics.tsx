import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Eye, 
  Play, 
  MessageCircle, 
  Heart, 
  Phone, 
  Mail, 
  Globe, 
  Share2,
  Tag,
  Monitor,
  Smartphone,
  Tablet,
  Clock,
  ScrollText,
  TrendingUp,
  Activity
} from "lucide-react";

interface SpeakerAnalytics {
  totalInteractions: number;
  profileViews: number;
  videoPlays: number;
  contactFormOpens: number;
  inquirySubmissions: number;
  favoriteAdds: number;
  socialClicks: number;
  phoneClicks: number;
  emailClicks: number;
  websiteClicks: number;
  reviewSectionViews: number;
  tagClicks: number;
  bioExpands: number;
  shareClicks: number;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  averageTimeOnPage: number;
  averageScrollDepth: number;
  timeframe: string;
  startDate: string;
  endDate: string;
}

interface SpeakerInteractionAnalyticsProps {
  speakerId: number;
  speakerName: string;
}

export function SpeakerInteractionAnalytics({ speakerId, speakerName }: SpeakerInteractionAnalyticsProps) {
  const [timeframe, setTimeframe] = useState('7d');

  const { data: analytics, isLoading } = useQuery<SpeakerAnalytics>({
    queryKey: ['/api/speakers', speakerId, 'analytics', timeframe],
    queryFn: async () => {
      // Include admin authentication header
      const adminEmail = localStorage.getItem('adminEmail');
      const headers: HeadersInit = {};
      if (adminEmail) {
        headers['X-Admin-Email'] = adminEmail;
      }
      
      const response = await fetch(`/api/speakers/${speakerId}/analytics?timeframe=${timeframe}`, {
        headers,
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getTimeframeLabel = (tf: string) => {
    switch (tf) {
      case '1d': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      default: return 'Last 7 Days';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{speakerName} - Profile Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Detailed interaction tracking and engagement metrics
          </p>
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Total Interactions</p>
                    <p className="text-2xl font-bold">{analytics.totalInteractions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Profile Views</p>
                    <p className="text-2xl font-bold">{analytics.profileViews}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Inquiries</p>
                    <p className="text-2xl font-bold">{analytics.inquirySubmissions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Favorites</p>
                    <p className="text-2xl font-bold">{analytics.favoriteAdds}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Play className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Video Plays</p>
                    <p className="text-xl font-bold">{analytics.videoPlays}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Phone Clicks</p>
                    <p className="text-xl font-bold">{analytics.phoneClicks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Email Clicks</p>
                    <p className="text-xl font-bold">{analytics.emailClicks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Website Clicks</p>
                    <p className="text-xl font-bold">{analytics.websiteClicks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Share2 className="h-4 w-4 text-cyan-500" />
                  <div>
                    <p className="text-sm font-medium">Social Clicks</p>
                    <p className="text-xl font-bold">{analytics.socialClicks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <ScrollText className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Review Views</p>
                    <p className="text-xl font-bold">{analytics.reviewSectionViews}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-indigo-500" />
                  <div>
                    <p className="text-sm font-medium">Tag Clicks</p>
                    <p className="text-xl font-bold">{analytics.tagClicks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-pink-500" />
                  <div>
                    <p className="text-sm font-medium">Bio Expands</p>
                    <p className="text-xl font-bold">{analytics.bioExpands}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Monitor className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Desktop</p>
                    <p className="text-2xl font-bold">{analytics.deviceBreakdown.desktop}</p>
                    <p className="text-xs text-muted-foreground">
                      {analytics.totalInteractions > 0 
                        ? `${Math.round((analytics.deviceBreakdown.desktop / analytics.totalInteractions) * 100)}%`
                        : '0%'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Mobile</p>
                    <p className="text-2xl font-bold">{analytics.deviceBreakdown.mobile}</p>
                    <p className="text-xs text-muted-foreground">
                      {analytics.totalInteractions > 0 
                        ? `${Math.round((analytics.deviceBreakdown.mobile / analytics.totalInteractions) * 100)}%`
                        : '0%'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Tablet className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Tablet</p>
                    <p className="text-2xl font-bold">{analytics.deviceBreakdown.tablet}</p>
                    <p className="text-xs text-muted-foreground">
                      {analytics.totalInteractions > 0 
                        ? `${Math.round((analytics.deviceBreakdown.tablet / analytics.totalInteractions) * 100)}%`
                        : '0%'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Average Time on Page</p>
                    <p className="text-2xl font-bold">
                      {analytics.averageTimeOnPage > 0 
                        ? formatTime(Math.round(analytics.averageTimeOnPage))
                        : '0m 0s'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <ScrollText className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Average Scroll Depth</p>
                    <p className="text-2xl font-bold">
                      {Math.round(analytics.averageScrollDepth)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Engagement Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Contact Form Opens</span>
                  <Badge variant="outline">{analytics.contactFormOpens}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Share Clicks</span>
                  <Badge variant="outline">{analytics.shareClicks}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Time Period</span>
                  <Badge variant="secondary">{getTimeframeLabel(timeframe)}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}