import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MousePointer, 
  MessageSquare, 
  Users,
  Calendar,
  Target,
  Activity,
  Award,
  Zap,
  Star,
  Phone,
  Mail,
  Globe,
  ExternalLink
} from "lucide-react";

interface AnalyticsDashboardProps {
  speakerId?: number;
}

export default function AnalyticsDashboard({ speakerId }: AnalyticsDashboardProps) {
  // Fetch dashboard data for all speakers or specific speaker
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: speakerId ? ['/api/analytics/speaker', speakerId] : ['/api/analytics/dashboard'],
    enabled: true,
  });

  const { data: topPerformers, isLoading: performersLoading } = useQuery({
    queryKey: ['/api/analytics/top-performers'],
    enabled: !speakerId, // Only fetch for overall dashboard
  });

  if (dashboardLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (speakerId && dashboardData) {
    return <SpeakerAnalytics data={dashboardData} speakerId={speakerId} />;
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Total Speakers</span>
            </div>
            <div className="text-3xl font-bold">{(dashboardData as any)?.overview?.totalSpeakers || 0}</div>
            <div className="text-sm text-gray-500">Active profiles</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <Eye className="h-5 w-5 text-green-500" />
              <span className="font-medium">Profile Views</span>
            </div>
            <div className="text-3xl font-bold">{(dashboardData as any)?.overview?.totalViews || 0}</div>
            <div className="text-sm text-gray-500">All time views</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <MousePointer className="h-5 w-5 text-orange-500" />
              <span className="font-medium">Total Clicks</span>
            </div>
            <div className="text-3xl font-bold">{(dashboardData as any)?.overview?.totalClicks || 0}</div>
            <div className="text-sm text-gray-500">Contact interactions</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              <span className="font-medium">Inquiries</span>
            </div>
            <div className="text-3xl font-bold">{(dashboardData as any)?.overview?.totalInquiries || 0}</div>
            <div className="text-sm text-gray-500">Booking requests</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Speakers</CardTitle>
          <CardDescription>Ranked by profile views and engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(topPerformers as any)?.map((performer: any, index: number) => (
              <div key={performer.speakerId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                    <span className="text-sm font-bold text-primary">#{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium">{performer.name}</div>
                    <div className="text-sm text-gray-500">Speaker ID: {performer.speakerId}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span>{performer.profileViews || 0} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MousePointer className="h-4 w-4 text-green-500" />
                    <span>{performer.totalClicks || 0} clicks</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-4 w-4 text-purple-500" />
                    <span>{performer.inquiryClicks || 0} inquiries</span>
                  </div>
                </div>
              </div>
            ))}
            {(!(topPerformers as any) || (topPerformers as any)?.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No analytics data available yet. Data will appear as speakers receive views and interactions.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SpeakerAnalytics({ data, speakerId }: { data: any; speakerId: number }) {
  const analytics = data.analytics;
  const performanceScore = data.performanceScore;
  const demandForecast = data.demandForecast;
  const trends = data.trends;

  const totalClicks = (analytics.emailClicks || 0) + (analytics.phoneClicks || 0) + 
                     (analytics.websiteClicks || 0) + (analytics.socialClicks || 0) + 
                     (analytics.inquiryClicks || 0);

  const engagementRate = analytics.profileViews > 0 ? 
    (totalClicks / analytics.profileViews * 100).toFixed(1) : '0.0';

  // Prepare chart data
  const clickDistribution = [
    { name: 'Email', value: analytics.emailClicks || 0, color: '#3b82f6' },
    { name: 'Phone', value: analytics.phoneClicks || 0, color: '#10b981' },
    { name: 'Website', value: analytics.websiteClicks || 0, color: '#f59e0b' },
    { name: 'Social', value: analytics.socialClicks || 0, color: '#ef4444' },
    { name: 'Inquiries', value: analytics.inquiryClicks || 0, color: '#8b5cf6' },
  ];

  const trendData = trends?.map((trend: any) => ({
    date: trend.date,
    views: trend.profileViews || 0,
    clicks: (trend.emailClicks || 0) + (trend.phoneClicks || 0) + 
            (trend.websiteClicks || 0) + (trend.socialClicks || 0) + 
            (trend.inquiryClicks || 0),
    inquiries: trend.inquiryClicks || 0,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Performance Score</span>
              </div>
              <Badge variant={performanceScore >= 70 ? "default" : performanceScore >= 40 ? "secondary" : "destructive"}>
                {performanceScore >= 70 ? "Excellent" : performanceScore >= 40 ? "Good" : "Needs Improvement"}
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-2">{performanceScore}/100</div>
            <Progress value={performanceScore} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <Eye className="h-5 w-5 text-green-500" />
              <span className="font-medium">Profile Views</span>
            </div>
            <div className="text-3xl font-bold">{analytics.profileViews || 0}</div>
            <div className="text-sm text-gray-500">Total views</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-5 w-5 text-orange-500" />
              <span className="font-medium">Engagement Rate</span>
            </div>
            <div className="text-3xl font-bold">{engagementRate}%</div>
            <div className="text-sm text-gray-500">Clicks per view</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="engagement" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="demand">Demand Forecast</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Click Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Click Distribution</CardTitle>
                <CardDescription>How users interact with contact methods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={clickDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                      >
                        {clickDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Contact Method Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Methods</CardTitle>
                <CardDescription>Detailed click analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span>Email Clicks</span>
                  </div>
                  <span className="font-medium">{analytics.emailClicks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-green-500" />
                    <span>Phone Clicks</span>
                  </div>
                  <span className="font-medium">{analytics.phoneClicks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-orange-500" />
                    <span>Website Clicks</span>
                  </div>
                  <span className="font-medium">{analytics.websiteClicks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="h-4 w-4 text-purple-500" />
                    <span>Social Clicks</span>
                  </div>
                  <span className="font-medium">{analytics.socialClicks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-pink-500" />
                    <span>Inquiry Clicks</span>
                  </div>
                  <span className="font-medium">{analytics.inquiryClicks || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demand" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Demand Metrics</CardTitle>
                <CardDescription>30-day demand analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Inquiry Volume</span>
                  <span className="font-medium">{demandForecast?.inquiryVolume || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Inquiry Rate</span>
                  <span className="font-medium">{demandForecast?.inquiryRate || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Demand Score</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{demandForecast?.demandScore || 0}/100</span>
                    <Badge variant={
                      (demandForecast?.demandScore || 0) >= 70 ? "default" : 
                      (demandForecast?.demandScore || 0) >= 40 ? "secondary" : "outline"
                    }>
                      {(demandForecast?.demandScore || 0) >= 70 ? "High" : 
                       (demandForecast?.demandScore || 0) >= 40 ? "Medium" : "Low"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Trend Direction</span>
                  <div className="flex items-center space-x-1">
                    {demandForecast?.trendDirection === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {demandForecast?.trendDirection === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                    {demandForecast?.trendDirection === 'stable' && <Activity className="h-4 w-4 text-gray-500" />}
                    <span className="capitalize">{demandForecast?.trendDirection || 'stable'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Event Types</CardTitle>
                <CardDescription>Most requested event categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {demandForecast?.topEventTypes?.map((eventType: string, index: number) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <span>{eventType}</span>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  )) || (
                    <div className="text-center py-4 text-gray-500">
                      No event data available yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>30-Day Trends</CardTitle>
              <CardDescription>Views, clicks, and inquiries over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="views" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="clicks" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="inquiries" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}