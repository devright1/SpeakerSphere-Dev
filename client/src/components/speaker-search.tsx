import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import type { Category } from "@shared/schema";

interface SpeakerSearchProps {
  onSearch: (searchTerm: string) => void;
}

export default function SpeakerSearch({ onSearch }: SpeakerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch categories from API
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const { data: suggestionData } = useQuery<string[]>({
    queryKey: ["/api/search/suggestions", { q: searchTerm }],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: searchTerm.length >= 2,
  });

  useEffect(() => {
    if (suggestionData) {
      setSuggestions(suggestionData);
      setShowSuggestions(true);
    }
  }, [suggestionData]);

  const handleSearch = () => {
    let finalSearchTerm = searchTerm;
    if (category && category !== "all") {
      finalSearchTerm = category;
    }
    onSearch(finalSearchTerm);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    onSearch(suggestion);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 shadow-2xl">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Input 
            type="text" 
            placeholder="Search speakers, topics, or expertise..." 
            className="w-full px-4 py-3 border-gray-300 text-gray-900 h-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          
          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-900 border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full h-12 text-gray-900">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.sort((a, b) => a.name.localeCompare(b.name)).map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name} ({cat.speakerCount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Button 
            className="w-full bg-accent hover:bg-orange-600 text-white h-12 text-base font-semibold"
            onClick={handleSearch}
          >
            <Search className="w-5 h-5 mr-2" />
            Search
          </Button>
        </div>
      </div>
    </div>
  );
}
