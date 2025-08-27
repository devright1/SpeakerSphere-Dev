import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X } from "lucide-react";
import type { Category } from "@shared/schema";

interface SearchFiltersProps {
  onFilterChange: (filters: any) => void;
}

export default function SearchFilters({ onFilterChange }: SearchFiltersProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [showFeeRange, setShowFeeRange] = useState(false);

  // Fee range is permanently disabled
  useEffect(() => {
    setShowFeeRange(false);
  }, []);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const handleCategoryChange = (category: string, checked: boolean) => {
    let newCategories;
    if (checked) {
      newCategories = [...selectedCategories, category];
    } else {
      newCategories = selectedCategories.filter(c => c !== category);
    }
    setSelectedCategories(newCategories);
  };

  const applyFilters = () => {
    const filters: any = {};
    
    if (selectedCategories.length > 0) {
      filters.categories = selectedCategories; // Send all selected categories
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
    setSelectedCategories([]);
    setPriceRange("");
    setCategorySearch("");
    onFilterChange({});
  };

  // Filter categories based on search
  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  ).sort((a, b) => b.speaker_count - a.speaker_count) || [];

  // Show top categories by default, or all filtered results
  const displayCategories = categorySearch 
    ? filteredCategories 
    : filteredCategories.slice(0, 20); // Show top 20 by default

  const removeCategory = (categoryToRemove: string) => {
    setSelectedCategories(selectedCategories.filter(cat => cat !== categoryToRemove));
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
          
          {/* Selected Categories */}
          {selectedCategories.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {selectedCategories.map((category) => (
                  <Badge key={category} variant="secondary" className="text-xs">
                    {category}
                    <button
                      onClick={() => removeCategory(category)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Category Search */}
          <div className="relative mb-3">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topics..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="pl-8"
            />
          </div>
          
          {/* Category List */}
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {displayCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={selectedCategories.includes(category.name)}
                      onCheckedChange={(checked) => 
                        handleCategoryChange(category.name, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`category-${category.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {category.name}
                    </Label>
                  </div>
                  <span className="text-gray-500 text-sm">({category.speaker_count})</span>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {!categorySearch && filteredCategories.length > 20 && (
            <p className="text-xs text-muted-foreground mt-2">
              Showing top 20 of {filteredCategories.length} topics. Search to find more.
            </p>
          )}
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
