import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SearchFilters from "@/components/search-filters";
import SpeakerSearch from "@/components/speaker-search";
import SpeakerCard from "@/components/speaker-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronDown } from "lucide-react";
import type { Speaker } from "@shared/schema";

interface FilterState {
  category?: string;
  categories?: string[];
  topics?: string[];
  location?: string;
  minRating?: number;
  maxFee?: number;
  minFee?: number;
  expertise?: string;
  search?: string;
}

const SPEAKERS_PER_PAGE = 20;

export default function Speakers() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>({});
  const [sortBy, setSortBy] = useState("relevance");
  const [currentPage, setCurrentPage] = useState(1);

  // Parse URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialFilters: FilterState = {};
    
    if (urlParams.get('category')) {
      initialFilters.category = urlParams.get('category')!;
    }

    if (urlParams.get('topic')) {
      // Single topic from URL (e.g., from Categories page)
      initialFilters.topics = [urlParams.get('topic')!];
    }

    if (urlParams.get('search')) {
      initialFilters.search = urlParams.get('search')!;
    }
    if (urlParams.get('expertise')) {
      initialFilters.expertise = urlParams.get('expertise')!;
    }
    
    if (Object.keys(initialFilters).length > 0) {
      setFilters(initialFilters);
    }
  }, [location]);

  const { data: speakers, isLoading, error } = useQuery<Speaker[]>({
    queryKey: ["/api/speakers", filters],
    queryFn: async () => {
      // Normalize single category to array for consistent handling
      const selectedCategories = filters.categories || (filters.category ? [filters.category] : []);
      
      // If categories are selected, use the new topic-based category endpoint
      if (selectedCategories.length > 0) {
        const allSpeakers: Speaker[] = [];
        const speakerIds = new Set<number>();
        
        // Make parallel requests for each category
        const categoryPromises = selectedCategories.map(async (category) => {
          const params = new URLSearchParams();
          
          // Add non-category filters to each request
          Object.entries(filters).forEach(([key, value]) => {
            if (key !== 'categories' && key !== 'category' && value !== undefined && value !== "") {
              if (Array.isArray(value)) {
                value.forEach(item => params.append(key, item.toString()));
              } else {
                params.append(key, value.toString());
              }
            }
          });
          
          const url = `/api/categories/${encodeURIComponent(category)}/speakers${params.toString() ? '?' + params.toString() : ''}`;
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Failed to fetch speakers for category: ${category}`);
          return response.json();
        });
        
        // Wait for all category requests to complete
        const categoryResults = await Promise.all(categoryPromises);
        
        // Combine and deduplicate speakers
        categoryResults.forEach(speakers => {
          speakers.forEach((speaker: Speaker) => {
            if (!speakerIds.has(speaker.id)) {
              speakerIds.add(speaker.id);
              allSpeakers.push(speaker);
            }
          });
        });
        
        return allSpeakers;
      } else {
        // No categories selected, use the traditional speakers endpoint
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            // Handle arrays (like topics) by adding multiple params
            if (Array.isArray(value)) {
              value.forEach(item => params.append(key, item.toString()));
            } else {
              params.append(key, value.toString());
            }
          }
        });
        
        const response = await fetch(`/api/speakers?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch speakers");
        return response.json();
      }
    },
  });

  const handleFilterChange = (newFilters: FilterState) => {
    // If newFilters is empty (clearing filters), replace completely
    if (Object.keys(newFilters).length === 0) {
      setFilters({});
    } else {
      setFilters({ ...filters, ...newFilters });
    }
  };

  const handleSearch = (searchTerm: string) => {
    setFilters({ ...filters, search: searchTerm.trim() });
  };

  const sortedSpeakers = useMemo(() => {
    if (!speakers) return [];
    return [...speakers].sort((a, b) => {
      // First, prioritize by subscription tier (featured speakers first)
      const tierOrder = { premier: 0, pro: 1, basic: 2 };
      const tierA = tierOrder[a.subscriptionTier as keyof typeof tierOrder] ?? 2;
      const tierB = tierOrder[b.subscriptionTier as keyof typeof tierOrder] ?? 2;
      
      if (tierA !== tierB) {
        return tierA - tierB; // Lower number = higher priority
      }
      
      // Within the same tier, apply user-selected sorting
      switch (sortBy) {
        case "rating":
          return parseFloat(b.overallRating || "0") - parseFloat(a.overallRating || "0");
        case "reviews":
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        default:
          // For "relevance", featured speakers are already prioritized by tier
          return parseFloat(b.overallRating || "0") - parseFloat(a.overallRating || "0");
      }
    });
  }, [speakers, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil((sortedSpeakers?.length || 0) / SPEAKERS_PER_PAGE);
  const startIndex = (currentPage - 1) * SPEAKERS_PER_PAGE;
  const endIndex = startIndex + SPEAKERS_PER_PAGE;
  const paginatedSpeakers = sortedSpeakers.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

  // Track search appearances for Premier speakers when search results are displayed
  useEffect(() => {
    if (!speakers || !filters.search || filters.search.trim() === '') return;
    
    // Track search appearance for each Premier speaker in results
    const premierSpeakers = speakers.filter(s => s.subscriptionTier === 'premier');
    
    premierSpeakers.forEach((speaker, index) => {
      // Track search appearance via analytics API
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user?.id || 'anonymous'
        },
        body: JSON.stringify({
          speakerId: speaker.id,
          eventType: 'search_appearance',
          metadata: {
            searchQuery: filters.search,
            position: index + 1,
            resultCount: speakers.length
          }
        })
      }).catch(() => {
        // Silent fail - don't disrupt user experience
      });
    });
  }, [speakers, filters.search, user?.id]);

  return (
    <div className="min-h-screen bg-neutral">
      <Header />
      
      {/* Hero Search Section */}
      <section className="bg-devright-blue text-white section-spacing" style={{backgroundColor: '#1E4347'}}>
        <div className="container-spacing">
          <div className="text-center mb-12">
            <h1 className="font-bold mb-6 text-balance">Find Your Next Dental Speaker</h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8 text-balance max-w-4xl mx-auto">Browse our curated collection of verified dental professionals and industry experts</p>
          </div>
          <SpeakerSearch onSearch={handleSearch} />
        </div>
      </section>

      {/* Main Content */}
      <section className="section-spacing bg-white">
        <div className="container-spacing">
          <div className="content-grid">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <SearchFilters onFilterChange={handleFilterChange} />
            </div>

            {/* Results */}
            <div className="lg:col-span-3 space-y-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
                <div className="space-y-2">
                  <h2 className="font-bold text-gray-900">
                    {isLoading ? "Loading..." : `${speakers?.length || 0} Speakers Found`}
                  </h2>
                  {filters.category && (
                    <p className="text-lg text-gray-600">
                      Category: <span className="font-medium text-primary">{filters.category}</span>
                    </p>
                  )}
                  {!isLoading && speakers && speakers.length > SPEAKERS_PER_PAGE && (
                    <p className="text-sm text-gray-500">
                      Showing {startIndex + 1}-{Math.min(endIndex, speakers.length)} of {speakers.length}
                    </p>
                  )}
                </div>
                <select 
                  className="px-4 py-3 border border-gray-300 rounded-lg focus-ring bg-white text-gray-900"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="relevance">Sort by Relevance</option>
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviews</option>
                </select>
              </div>

              {error && (
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load speakers. Please try again.
                  </AlertDescription>
                </Alert>
              )}

              {isLoading ? (
                <div className="results-grid">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-md card-spacing hover-lift clean-transition">
                      <div className="flex items-start space-x-4">
                        <Skeleton className="w-16 h-16 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                          <Skeleton className="h-8 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="results-grid">
                    {paginatedSpeakers.map((speaker) => (
                      <SpeakerCard key={speaker.id} speaker={speaker} discoverySource={filters.search ? 'search' : 'category'} />
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-12 pt-8 border-t border-gray-200">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-6 py-3 font-medium"
                      >
                        Previous
                      </Button>
                      
                      <div className="flex gap-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-12 h-12 font-medium"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-6 py-3 font-medium"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}

              {speakers && speakers.length === 0 && !isLoading && (
                <div className="text-center py-16">
                  <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No speakers found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
