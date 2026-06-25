import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DisciplineWithCounts {
  id: number;
  name: string;
  categoryCount: number;
  speakerCount: number;
}

interface CategoryItem {
  id: number;
  name: string;
}

interface SearchFiltersProps {
  onFilterChange: (filters: any) => void;
}

export default function SearchFilters({ onFilterChange }: SearchFiltersProps) {
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<number | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState("");
  const [showFeeRange, setShowFeeRange] = useState(false);

  useEffect(() => {
    setShowFeeRange(false);
  }, []);

  const { data: disciplines } = useQuery<DisciplineWithCounts[]>({
    queryKey: ["/api/disciplines"],
  });

  const { data: categories } = useQuery<CategoryItem[]>({
    queryKey: ["/api/disciplines", selectedDisciplineId, "categories"],
    queryFn: async () => {
      const response = await fetch(`/api/disciplines/${selectedDisciplineId}/categories`);
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
    enabled: selectedDisciplineId != null,
  });

  const handleDisciplineChange = (value: string) => {
    const id = parseInt(value);
    setSelectedDisciplineId(isNaN(id) ? null : id);
    setSelectedCategoryIds([]);
  };

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    setSelectedCategoryIds((prev) =>
      checked ? [...prev, categoryId] : prev.filter((id) => id !== categoryId)
    );
  };

  const applyFilters = () => {
    const filters: any = {};

    if (selectedDisciplineId != null) {
      filters.disciplineId = selectedDisciplineId;
      if (selectedCategoryIds.length > 0) {
        filters.categoryIds = selectedCategoryIds;
      }
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
    setSelectedDisciplineId(null);
    setSelectedCategoryIds([]);
    setPriceRange("");
    onFilterChange({});
  };

  return (
    <Card className="sticky top-6 shadow-lg border-0">
      <CardHeader className="card-spacing pb-4">
        <CardTitle className="flex items-center justify-between text-xl">
          Filter Speakers
          <Button variant="ghost" size="sm" onClick={clearFilters} className="clean-transition">
            Clear All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 max-h-[70vh] scrollable-filters px-6 pb-6">
        {/* Discipline */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4 text-lg">Discipline</h4>
          <Select
            value={selectedDisciplineId != null ? String(selectedDisciplineId) : ""}
            onValueChange={handleDisciplineChange}
          >
            <SelectTrigger data-testid="select-filter-discipline">
              <SelectValue placeholder="All disciplines" />
            </SelectTrigger>
            <SelectContent>
              {(disciplines || [])
                .slice()
                .sort((a, b) => (b.speakerCount || 0) - (a.speakerCount || 0))
                .map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name} ({d.speakerCount})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Categories (dynamic) */}
        {selectedDisciplineId != null && (categories || []).length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-lg">Categories</h4>
            <div className="space-y-3">
              {(categories || []).map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedCategoryIds.includes(category.id)}
                    onCheckedChange={(checked) =>
                      handleCategoryChange(category.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`category-${category.id}`}
                    className="text-sm font-medium leading-none"
                  >
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {showFeeRange && (
          <>
            <Separator />
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

        <Button
          onClick={applyFilters}
          className="w-full bg-primary hover:bg-blue-700 py-3 text-lg font-semibold clean-transition"
        >
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
}
