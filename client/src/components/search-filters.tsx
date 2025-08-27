import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { SpeakingTopic } from "@shared/schema";

interface SearchFiltersProps {
  onFilterChange: (filters: any) => void;
}

export default function SearchFilters({ onFilterChange }: SearchFiltersProps) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState("");

  const [showFeeRange, setShowFeeRange] = useState(false);

  // Fee range is permanently disabled
  useEffect(() => {
    setShowFeeRange(false);
  }, []);

  const { data: topics } = useQuery<SpeakingTopic[]>({
    queryKey: ["/api/topics"],
    queryFn: async () => {
      const response = await fetch("/api/topics");
      if (!response.ok) throw new Error("Failed to fetch topics");
      return response.json();
    },
  });

  // Sort topics by speaker count (descending) to show most popular first
  const sortedTopics = topics?.slice().sort((a, b) => (b.speakerCount || 0) - (a.speakerCount || 0)) || [];

  const handleTopicChange = (topic: string, checked: boolean) => {
    let newTopics;
    if (checked) {
      newTopics = [...selectedTopics, topic];
    } else {
      newTopics = selectedTopics.filter(t => t !== topic);
    }
    setSelectedTopics(newTopics);
  };

  const applyFilters = () => {
    const filters: any = {};
    
    if (selectedTopics.length > 0) {
      filters.topics = selectedTopics; // Send all selected topics
    }
    
    if (priceRange) {
      switch (priceRange) {
        case "under-5000":
          filters.maxFee = 5000;
          break;
        case "5000-10000":
          filters.minFee = 5000;
          filters.maxFee = 10000;
          break;
        case "10000-20000":
          filters.minFee = 10000;
          filters.maxFee = 20000;
          break;
        case "over-20000":
          filters.minFee = 20000;
          break;
      }
    }
    
    onFilterChange(filters);
  };

  const clearFilters = () => {
    setSelectedTopics([]);
    setPriceRange("");
    onFilterChange({});
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Filter Speakers
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 max-h-[70vh] scrollable-filters">
        {/* Categories */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Topics</h4>
          <div className="space-y-2">
            {sortedTopics?.map((topic) => (
              <div key={topic.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`topic-${topic.id}`}
                    checked={selectedTopics.includes(topic.name)}
                    onCheckedChange={(checked) => 
                      handleTopicChange(topic.name, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={`topic-${topic.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {topic.name}
                  </Label>
                </div>
                <span className="text-gray-500 text-sm">({topic.speakerCount})</span>
              </div>
            ))}
          </div>
        </div>

        {showFeeRange && (
          <>
            <Separator />
            {/* Price Range */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Fee Range</h4>
              <RadioGroup value={priceRange} onValueChange={setPriceRange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="under-5000" id="under-5000" />
                  <Label htmlFor="under-5000">Under $5,000</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="5000-10000" id="5000-10000" />
                  <Label htmlFor="5000-10000">$5,000 - $10,000</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="10000-20000" id="10000-20000" />
                  <Label htmlFor="10000-20000">$10,000 - $20,000</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="over-20000" id="over-20000" />
                  <Label htmlFor="over-20000">$20,000+</Label>
                </div>
              </RadioGroup>
            </div>
          </>
        )}



        <Button onClick={applyFilters} className="w-full bg-primary hover:bg-blue-700">
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
}
