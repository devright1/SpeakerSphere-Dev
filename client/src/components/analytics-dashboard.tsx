import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  AreaChart,
  Legend
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
              <span className="font-medium">Engagement Clicks</span>
            </div>
            <div className="text-3xl font-bold">{(dashboardData as any)?.overview?.totalClicks || 0}</div>
            <div className="text-sm text-gray-500">Profile interactions</div>
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
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const { data: filteredData, isLoading: isFiltering } = useQuery({
    queryKey: ['/api/analytics/speaker', speakerId, 'month', selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/speaker/${speakerId}?month=${selectedMonth}&year=${selectedYear}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  const displayData = filteredData || data;
  const analytics = displayData.analytics || displayData;
  const performanceScore = displayData.performanceScore;
  const demandForecast = displayData.demandForecast;
  const trends = displayData.trends || displayData.dailyTrends;

  // Use the new engagementClicks metric which tracks actual profile activity
  const totalEngagement = analytics.engagementClicks || 0;

  const engagementRate = analytics.profileViews > 0 ? 
    (totalEngagement / analytics.profileViews * 100).toFixed(1) : '0.0';

  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const currentYear = now.getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  // Prepare chart data for engagement distribution (matches engagementInteractionTypes on backend)
  const engagementDistribution = [
    { name: 'Social Links', value: analytics.socialClicks || 0, color: '#3b82f6' },
    { name: 'Tab Clicks', value: analytics.tabClicks || 0, color: '#10b981' },
    { name: 'Downloads', value: analytics.resourceDownloads || 0, color: '#f59e0b' },
    { name: 'Inquiries', value: analytics.inquiryClicks || 0, color: '#8b5cf6' },
    { name: 'Topic Clicks', value: analytics.topicClicks || 0, color: '#ef4444' },
    { name: 'Bio Expands', value: analytics.bioExpands || 0, color: '#06b6d4' },
    { name: 'Website', value: analytics.websiteClicks || 0, color: '#ec4899' },
    { name: 'Shares', value: analytics.shareClicks || 0, color: '#14b8a6' },
    { name: 'Review Views', value: analytics.reviewSectionViews || 0, color: '#f97316' },
  ];

  const trendData = trends?.map((trend: any) => ({
    date: trend.day || trend.date,
    profileViews: trend.profileViews || 0,
    totalClicks: trend.totalClicks || 0, // Engagement clicks from backend
    socialClicks: trend.socialClicks || 0,
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
            {/* Engagement Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Distribution</CardTitle>
                <CardDescription>How visitors interact with your profile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={engagementDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                      >
                        {engagementDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Profile Activity Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Activity</CardTitle>
                <CardDescription>Detailed engagement metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Total Engagement</span>
                  </div>
                  <span className="font-bold text-lg">{analytics.engagementClicks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="h-4 w-4 text-blue-500" />
                    <span>Social Link Clicks</span>
                  </div>
                  <span className="font-medium">{analytics.socialClicks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MousePointer className="h-4 w-4 text-green-500" />
                    <span>Tab Clicks</span>
                  </div>
                  <span className="font-medium">{analytics.tabClicks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    <span>Resource Downloads</span>
                  </div>
                  <span className="font-medium">{analytics.resourceDownloads || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-purple-500" />
                    <span>Inquiry Clicks</span>
                  </div>
                  <span className="font-medium">{analytics.inquiryClicks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-cyan-500" />
                    <span>Topic Clicks</span>
                  </div>
                  <span className="font-medium">{analytics.topicClicks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-pink-500" />
                    <span>Website Clicks</span>
                  </div>
                  <span className="font-medium">{analytics.websiteClicks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-teal-500" />
                    <span>Profile Shares</span>
                  </div>
                  <span className="font-medium">{analytics.shareClicks || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-orange-500" />
                    <span>Review Section Views</span>
                  </div>
                  <span className="font-medium">{analytics.reviewSectionViews || 0}</span>
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Monthly Interaction Trends</CardTitle>
                  <CardDescription>Profile views and engagement activity (tab clicks, downloads, social clicks, etc.)</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select 
                    value={selectedMonth.toString()} 
                    onValueChange={(val) => setSelectedMonth(parseInt(val))}
                  >
                    <SelectTrigger className="w-[140px]" data-testid="select-month">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={selectedYear.toString()} 
                    onValueChange={(val) => setSelectedYear(parseInt(val))}
                  >
                    <SelectTrigger className="w-[100px]" data-testid="select-year">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isFiltering ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="animate-pulse text-gray-500">Loading data...</div>
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Line 
                        type="monotone" 
                        dataKey="profileViews" 
                        name="Profile Views"
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#3b82f6' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalClicks" 
                        name="Engagement Clicks"
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#10b981', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#10b981' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="socialClicks" 
                        name="Social Clicks"
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#f59e0b' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}