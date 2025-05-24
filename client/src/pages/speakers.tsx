import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SearchFilters from "@/components/search-filters";
import SpeakerSearch from "@/components/speaker-search";
import SpeakerCard from "@/components/speaker-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { Speaker } from "@shared/schema";

interface FilterState {
  category?: string;
  location?: string;
  minRating?: number;
  maxFee?: number;
  minFee?: number;
  expertise?: string;
  availability?: string;
  search?: string;
}

export default function Speakers() {
  const [filters, setFilters] = useState<FilterState>({});
  const [sortBy, setSortBy] = useState("relevance");

  const { data: speakers, isLoading, error } = useQuery<Speaker[]>({
    queryKey: ["/api/speakers", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, value.toString());
        }
      });
      
      const response = await fetch(`/api/speakers?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch speakers");
      return response.json();
    },
  });

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters({ ...filters, ...newFilters });
  };

  const handleSearch = (searchTerm: string) => {
    setFilters({ ...filters, search: searchTerm });
  };

  const sortedSpeakers = speakers ? [...speakers].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return parseFloat(b.rating || "0") - parseFloat(a.rating || "0");
      case "reviews":
        return b.reviewCount - a.reviewCount;
      case "price-low":
        return parseFloat(a.fee) - parseFloat(b.fee);
      case "price-high":
        return parseFloat(b.fee) - parseFloat(a.fee);
      default:
        return 0;
    }
  }) : [];

  return (
    <div className="min-h-screen bg-neutral">
      <Header />
      
      {/* Hero Search Section */}
      <section className="bg-gradient-to-br from-primary to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Perfect Speaker</h1>
            <p className="text-xl opacity-90">Browse our curated collection of verified professional speakers</p>
          </div>
          <SpeakerSearch onSearch={handleSearch} />
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <SearchFilters onFilterChange={handleFilterChange} />
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isLoading ? "Loading..." : `${speakers?.length || 0} Speakers Found`}
                </h2>
                <select 
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="relevance">Sort by Relevance</option>
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviews</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-md p-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sortedSpeakers.map((speaker) => (
                    <SpeakerCard key={speaker.id} speaker={speaker} />
                  ))}
                </div>
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
