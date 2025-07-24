import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpeakerInteractionAnalytics } from "@/components/speaker-interaction-analytics";
import { 
  Search, 
  SlidersHorizontal, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw,
  MousePointer,
  ExternalLink,
  Users
} from "lucide-react";

export function DetailedSpeakerAnalytics() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<number | null>(null);

  // Fetch all speakers and categories
  const { data: speakers, isLoading: speakersLoading } = useQuery({
    queryKey: ['/api/speakers'],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
  });

  const speakersArray = Array.isArray((speakers as any)?.data) ? (speakers as any).data : [];
  const uniqueCategories = Array.from(new Set(speakersArray.map((s: any) => s.category).filter(Boolean)));

  // Filter and sort speakers
  const filteredAndSortedSpeakers = useMemo(() => {
    let filtered = speakersArray;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((speaker: any) => 
        speaker.name.toLowerCase().includes(query) ||
        speaker.title?.toLowerCase().includes(query) ||
        speaker.category?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((speaker: any) => speaker.category === categoryFilter);
    }

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case "name":
          return sortOrder === "asc" 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case "category":
          return sortOrder === "asc" 
            ? (a.category || "").localeCompare(b.category || "")
            : (b.category || "").localeCompare(a.category || "");
        default:
          return sortOrder === "asc" 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
      }
    });

    return filtered;
  }, [speakersArray, searchQuery, categoryFilter, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setSortBy("name");
    setSortOrder("asc");
  };

  if (speakersLoading || categoriesLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-6"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2 text-blue-800 mb-2">
          <MousePointer className="h-5 w-5" />
          <span className="font-medium">Advanced Interaction Tracking</span>
        </div>
        <p className="text-sm text-blue-700">
          Track detailed user interactions for each speaker including profile views, video plays, contact form submissions, 
          favorite actions, social media clicks, and device/engagement analytics. Data updates in real-time as users interact with speaker profiles.
        </p>
      </div>

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
              {(categoryFilter !== "all" || sortBy !== "name") && (
                <Badge variant="secondary" className="ml-1">
                  Active
                </Badge>
              )}
            </Button>
          </div>
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
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Order</label>
                  <div className="flex space-x-2">
                    <Button
                      variant={sortOrder === "asc" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortOrder("asc")}
                      className="flex-1"
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      A to Z
                    </Button>
                    <Button
                      variant={sortOrder === "desc" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortOrder("desc")}
                      className="flex-1"
                    >
                      <TrendingDown className="h-4 w-4 mr-1" />
                      Z to A
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
            Showing {filteredAndSortedSpeakers.length} of {speakersArray.length} speakers
            {searchQuery && ` matching "${searchQuery}"`}
            {categoryFilter !== "all" && ` in "${categoryFilter}"`}
          </span>
        </div>
      </div>

      {/* Speaker Selection and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Speaker List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Speaker</CardTitle>
              <CardDescription>
                Choose a speaker to view their detailed interaction analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAndSortedSpeakers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No speakers found</h3>
                    <p className="text-gray-500 mb-4">
                      Try adjusting your search terms or filters.
                    </p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  filteredAndSortedSpeakers.map((speaker: any) => (
                    <div 
                      key={speaker.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedSpeakerId === speaker.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedSpeakerId(speaker.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <img 
                          src={speaker.imageUrl} 
                          alt={speaker.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{speaker.name}</p>
                          <p className="text-xs text-gray-600">{speaker.title}</p>
                          {speaker.category && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {speaker.category}
                            </Badge>
                          )}
                        </div>
                        {selectedSpeakerId === speaker.id && (
                          <div className="text-primary">
                            <MousePointer className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Display */}
        <div className="lg:col-span-2">
          {selectedSpeakerId ? (
            <div className="space-y-4">
              {(() => {
                const selectedSpeaker = filteredAndSortedSpeakers.find((s: any) => s.id === selectedSpeakerId);
                return selectedSpeaker ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={selectedSpeaker.imageUrl} 
                          alt={selectedSpeaker.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="text-lg font-semibold">{selectedSpeaker.name}</h3>
                          <p className="text-gray-600">{selectedSpeaker.title}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/speaker/${selectedSpeaker.slug}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
                    </div>
                    
                    <SpeakerInteractionAnalytics 
                      speakerId={selectedSpeakerId} 
                      speakerName={selectedSpeaker.name}
                    />
                  </div>
                ) : null;
              })()}
            </div>
          ) : (
            <Card className="h-full">
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <MousePointer className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Speaker</h3>
                  <p className="text-gray-500 max-w-sm">
                    Choose a speaker from the list to view their detailed interaction analytics, 
                    including profile views, engagement metrics, and user behavior patterns.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}