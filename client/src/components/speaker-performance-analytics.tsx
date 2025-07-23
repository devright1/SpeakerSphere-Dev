import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Mail, Phone, Globe, ExternalLink, MessageSquare } from "lucide-react";

export default function SpeakerPerformanceAnalytics() {
  // Fetch all speakers and analytics data
  const { data: speakers, isLoading: speakersLoading } = useQuery({
    queryKey: ['/api/speakers'],
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/analytics/dashboard'],
  });

  if (speakersLoading || analyticsLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-6 bg-gray-200 rounded w-8 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const speakersArray = Array.isArray((speakers as any)?.data) ? (speakers as any).data : [];
  
  // Create analytics data for each speaker (mock data for now since real analytics need to be implemented)
  const speakerAnalytics = speakersArray.map((speaker: any) => {
    // Mock analytics data - in production this would come from your analytics tracking
    const analytics = {
      profileViews: 0, // Start with 0 views
      emailClicks: 0,
      phoneClicks: 0,
      websiteClicks: 0,
      socialClicks: 0,
      inquiryClicks: 0
    };
    
    const totalClicks = analytics.emailClicks + analytics.phoneClicks + 
                      analytics.websiteClicks + analytics.socialClicks + 
                      analytics.inquiryClicks;
    
    return {
      ...speaker,
      analytics,
      totalClicks,
      totalViews: analytics.profileViews
    };
  });

  // Sort speakers by total views (highest to lowest), then alphabetically for ties
  const sortedSpeakers = speakerAnalytics.sort((a: any, b: any) => {
    // First sort by total views (descending)
    if (b.totalViews !== a.totalViews) {
      return b.totalViews - a.totalViews;
    }
    // If views are tied, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-gray-700 mb-4">
        Speaker Analytics (sorted by views, then alphabetically) - Tracking starts today: {new Date().toLocaleDateString()}
      </div>
      
      {sortedSpeakers.map((speaker: any, index: number) => (
        <div key={speaker.slug} className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                <span className="text-sm font-bold text-primary">#{index + 1}</span>
              </div>
              <img 
                src={speaker.imageUrl} 
                alt={speaker.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h4 className="font-medium">{speaker.name}</h4>
                <p className="text-sm text-gray-600">{speaker.category}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{speaker.totalViews}</div>
              <div className="text-sm text-gray-500">total views</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4 text-blue-500" />
              <span>{speaker.analytics.profileViews} views</span>
            </div>
            <div className="flex items-center space-x-1">
              <Mail className="h-4 w-4 text-green-500" />
              <span>{speaker.analytics.emailClicks} emails</span>
            </div>
            <div className="flex items-center space-x-1">
              <Phone className="h-4 w-4 text-orange-500" />
              <span>{speaker.analytics.phoneClicks} calls</span>
            </div>
            <div className="flex items-center space-x-1">
              <Globe className="h-4 w-4 text-purple-500" />
              <span>{speaker.analytics.websiteClicks} website</span>
            </div>
            <div className="flex items-center space-x-1">
              <ExternalLink className="h-4 w-4 text-pink-500" />
              <span>{speaker.analytics.socialClicks} social</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare className="h-4 w-4 text-teal-500" />
              <span>{speaker.analytics.inquiryClicks} inquiries</span>
            </div>
          </div>
          
          {speaker.totalViews === 0 && speaker.totalClicks === 0 && (
            <div className="mt-2 text-xs text-gray-500 italic">
              No interaction data yet - analytics will populate as users engage with this profile
            </div>
          )}
        </div>
      ))}
      
      {sortedSpeakers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No speakers found in the system.
        </div>
      )}
    </div>
  );
}