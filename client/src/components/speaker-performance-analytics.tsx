import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  Mail, 
  Phone, 
  Globe, 
  ExternalLink, 
  MessageSquare, 
  Search, 
  SlidersHorizontal, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Play,
  Heart,
  Share2,
  Tag,
  MousePointer,
  Filter,
  ArrowUpDown,
  RotateCcw
} from "lucide-react";

interface SpeakerWithAnalytics {
  id: number;
  name: string;
  slug: string;
  category: string;
  title: string;
  imageUrl: string;
  hideProfile?: boolean;
  analytics: {
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
  };
}

export default function SpeakerPerformanceAnalytics() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("totalInteractions");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [timeframe, setTimeframe] = useState("30d");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch all speakers and their analytics data
  const { data: speakers, isLoading: speakersLoading } = useQuery({
    queryKey: ['/api/speakers'],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Fetch analytics for each speaker
  const speakersArray = Array.isArray((speakers as any)?.data) ? (speakers as any).data : [];
  
  const speakerAnalyticsQueries = useQuery({
    queryKey: ['speaker-analytics-batch', timeframe],
    queryFn: async () => {
      const analyticsPromises = speakersArray.map(async (speaker: any) => {
        try {
          const response = await fetch(`/api/speakers/${speaker.id}/analytics?timeframe=${timeframe}`);
          if (!response.ok) throw new Error('Failed to fetch analytics');
          const analytics = await response.json();
          return {
            ...speaker,
            analytics
          };
        } catch (error) {
          // Return speaker with empty analytics if fetch fails
          return {
            ...speaker,
            analytics: {
              totalInteractions: 0,
              profileViews: 0,
              videoPlays: 0,
              contactFormOpens: 0,
              inquirySubmissions: 0,
              favoriteAdds: 0,
              socialClicks: 0,
              phoneClicks: 0,
              emailClicks: 0,
              websiteClicks: 0,
              reviewSectionViews: 0,
              tagClicks: 0,
              bioExpands: 0,
              shareClicks: 0,
            }
          };
        }
      });
      return Promise.all(analyticsPromises);
    },
    enabled: speakersArray.length > 0,
  });

  const speakersWithAnalytics: SpeakerWithAnalytics[] = speakerAnalyticsQueries.data || [];

  // Get unique categories for filter
  const categoriesArray = Array.isArray((categories as any)?.data) ? (categories as any).data : [];
  const uniqueCategories = Array.from(new Set(speakersWithAnalytics.map(s => s.category).filter(Boolean)));

  // Filter and sort speakers
  const filteredAndSortedSpeakers = useMemo(() => {
    let filtered = speakersWithAnalytics;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(speaker => 
        speaker.name.toLowerCase().includes(query) ||
        speaker.title?.toLowerCase().includes(query) ||
        speaker.category?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(speaker => speaker.category === categoryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;

      switch (sortBy) {
        case "name":
          return sortOrder === "asc" 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case "category":
          return sortOrder === "asc" 
            ? (a.category || "").localeCompare(b.category || "")
            : (b.category || "").localeCompare(a.category || "");
        case "profileViews":
          aValue = a.analytics.profileViews;
          bValue = b.analytics.profileViews;
          break;
        case "totalInteractions":
        default:
          aValue = a.analytics.totalInteractions;
          bValue = b.analytics.totalInteractions;
          break;
      }

      if (sortBy !== "name" && sortBy !== "category") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

    return filtered;
  }, [speakersWithAnalytics, searchQuery, categoryFilter, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setSortBy("totalInteractions");
    setSortOrder("desc");
  };

  if (speakersLoading || categoriesLoading || speakerAnalyticsQueries.isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-40 animate-pulse"></div>
        </div>
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

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search speakers by name, title, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
              {(categoryFilter !== "all" || sortBy !== "totalInteractions") && (
                <Badge variant="secondary" className="ml-1">
                  Active
                </Badge>
              )}
            </Button>
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

        {/* Filter Panel */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {uniqueCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="totalInteractions">Total Interactions</SelectItem>
                      <SelectItem value="profileViews">Profile Views</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Order</label>
                  <div className="flex space-x-2">
                    <Button
                      variant={sortOrder === "desc" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortOrder("desc")}
                      className="flex-1"
                    >
                      <TrendingDown className="h-4 w-4 mr-1" />
                      High to Low
                    </Button>
                    <Button
                      variant={sortOrder === "asc" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortOrder("asc")}
                      className="flex-1"
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Low to High
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button variant="ghost" onClick={clearFilters} className="text-sm">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Clear All Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredAndSortedSpeakers.length} of {speakersWithAnalytics.length} speakers
            {searchQuery && ` matching "${searchQuery}"`}
            {categoryFilter !== "all" && ` in "${categoryFilter}"`}
          </span>
          <span>
            Last updated: {new Date().toLocaleString()}
          </span>
        </div>
      </div>

      {/* Speaker List */}
      <div className="space-y-4">
        {filteredAndSortedSpeakers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No speakers found</h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search terms or filters to find speakers.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedSpeakers.map((speaker, index) => (
            <Card key={speaker.slug} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                      <span className="text-sm font-bold text-primary">#{index + 1}</span>
                    </div>
                    <img 
                      src={speaker.imageUrl} 
                      alt={speaker.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-lg">{speaker.name}</h4>
                      <p className="text-gray-600">{speaker.title}</p>
                      {speaker.category && (
                        <Badge variant="secondary" className="mt-1">
                          {speaker.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {speaker.analytics.totalInteractions}
                    </div>
                    <div className="text-sm text-gray-500">total interactions</div>
                    {speaker.hideProfile && (
                      <Badge variant="destructive" className="mt-1">
                        Hidden
                      </Badge>
                    )}
                  </div>
                </div>

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="engagement">Engagement</TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Eye className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                        <div className="text-lg font-semibold">{speaker.analytics.profileViews}</div>
                        <div className="text-xs text-gray-600">Profile Views</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <Play className="h-5 w-5 text-green-500 mx-auto mb-1" />
                        <div className="text-lg font-semibold">{speaker.analytics.videoPlays}</div>
                        <div className="text-xs text-gray-600">Video Plays</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <Heart className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                        <div className="text-lg font-semibold">{speaker.analytics.favoriteAdds}</div>
                        <div className="text-xs text-gray-600">Favorites</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                        <div className="text-lg font-semibold">{speaker.analytics.inquirySubmissions}</div>
                        <div className="text-xs text-gray-600">Inquiries</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="engagement" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <MousePointer className="h-5 w-5 text-gray-500 mx-auto mb-1" />
                        <div className="text-lg font-semibold">{speaker.analytics.bioExpands}</div>
                        <div className="text-xs text-gray-600">Bio Expands</div>
                      </div>
                      <div className="text-center p-3 bg-pink-50 rounded-lg">
                        <Share2 className="h-5 w-5 text-pink-500 mx-auto mb-1" />
                        <div className="text-lg font-semibold">{speaker.analytics.shareClicks}</div>
                        <div className="text-xs text-gray-600">Shares</div>
                      </div>
                      <div className="text-center p-3 bg-indigo-50 rounded-lg">
                        <Tag className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
                        <div className="text-lg font-semibold">{speaker.analytics.tagClicks}</div>
                        <div className="text-xs text-gray-600">Tag Clicks</div>
                      </div>
                      <div className="text-center p-3 bg-teal-50 rounded-lg">
                        <Eye className="h-5 w-5 text-teal-500 mx-auto mb-1" />
                        <div className="text-lg font-semibold">{speaker.analytics.reviewSectionViews}</div>
                        <div className="text-xs text-gray-600">Review Views</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="contact" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <Mail className="h-5 w-5 text-green-500 mx-auto mb-1" />
                        <div className="text-lg font-semibold">{speaker.analytics.emailClicks}</div>
                        <div className="text-xs text-gray-600">Email Clicks</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Phone className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                        <div className="text-lg font-semibold">{speaker.analytics.phoneClicks}</div>
                        <div className="text-xs text-gray-600">Phone Clicks</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <Globe className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                        <div className="text-lg font-semibold">{speaker.analytics.websiteClicks}</div>
                        <div className="text-xs text-gray-600">Website Clicks</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <ExternalLink className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                        <div className="text-lg font-semibold">{speaker.analytics.socialClicks}</div>
                        <div className="text-xs text-gray-600">Social Clicks</div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end mt-4 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/speaker/${speaker.slug}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}