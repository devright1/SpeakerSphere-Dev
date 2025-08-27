import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Category } from "@shared/schema";

interface SearchFiltersProps {
  onFilterChange: (filters: any) => void;
}

export default function SearchFilters({ onFilterChange }: SearchFiltersProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState("");

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
            {categories?.map((category) => (
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
                <span className="text-gray-500 text-sm">({category.speakerCount})</span>
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
