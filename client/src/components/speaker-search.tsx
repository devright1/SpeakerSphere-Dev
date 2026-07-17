import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SpeakerSearchProps {
  onSearch: (searchTerm: string) => void;
}

export default function SpeakerSearch({ onSearch }: SpeakerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
    onSearch(searchTerm.trim());
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
    onSearch(suggestion.trim());
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 shadow-2xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Input 
            type="text" 
            placeholder="Search speakers, topics, or expertise..." 
            className="w-full px-4 py-3 border-gray-300 text-gray-900 h-12 pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {searchTerm && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => { setSearchTerm(""); onSearch(""); setShowSuggestions(false); }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
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
