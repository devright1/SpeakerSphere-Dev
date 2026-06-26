import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface DisciplineWithCounts {
  id: number;
  name: string;
  categoryCount: number;
  speakerCount: number;
}

interface SearchFiltersProps {
  onFilterChange: (filters: any) => void;
}

export default function SearchFilters({ onFilterChange }: SearchFiltersProps) {
  const [selectedDisciplineIds, setSelectedDisciplineIds] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState("");
  const [showFeeRange, setShowFeeRange] = useState(false);

  useEffect(() => {
    setShowFeeRange(false);
  }, []);

  const { data: disciplines } = useQuery<DisciplineWithCounts[]>({
    queryKey: ["/api/disciplines"],
  });

  const handleDisciplineToggle = (id: number, checked: boolean) => {
    setSelectedDisciplineIds((prev) =>
      checked ? [...prev, id] : prev.filter((d) => d !== id)
    );
  };

  const applyFilters = () => {
    const filters: any = {};

    if (selectedDisciplineIds.length > 0) {
      filters.disciplineIds = selectedDisciplineIds;
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
    setSelectedDisciplineIds([]);
    setPriceRange("");
    onFilterChange({});
  };

  const sortedDisciplines = (disciplines || [])
    .slice()
    .sort((a, b) => (b.speakerCount || 0) - (a.speakerCount || 0));

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
          <div className="space-y-3">
            {sortedDisciplines.map((d) => (
              <div key={d.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`discipline-${d.id}`}
                  checked={selectedDisciplineIds.includes(d.id)}
                  onCheckedChange={(checked) =>
                    handleDisciplineToggle(d.id, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`discipline-${d.id}`}
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {d.name}
                  {d.speakerCount > 0 && (
                    <span className="ml-1 text-gray-400 font-normal">({d.speakerCount})</span>
                  )}
                </Label>
              </div>
            ))}
          </div>
        </div>

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
