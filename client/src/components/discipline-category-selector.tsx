import { useQuery } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DisciplineWithCounts {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number | null;
  categoryCount: number;
  speakerCount: number;
}

interface CategoryItem {
  id: number;
  name: string;
  description: string;
  disciplineId: number | null;
  sortOrder: number | null;
}

interface DisciplineCategorySelectorProps {
  selectedDisciplineId: number | null;
  selectedCategoryIds: number[];
  onChange: (disciplineId: number | null, categoryIds: number[]) => void;
  maxCategories?: number;
  error?: string;
}

export function DisciplineCategorySelector({
  selectedDisciplineId,
  selectedCategoryIds,
  onChange,
  maxCategories = 3,
  error,
}: DisciplineCategorySelectorProps) {
  const { data: disciplines, isLoading: disciplinesLoading } = useQuery<DisciplineWithCounts[]>({
    queryKey: ["/api/disciplines"],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<CategoryItem[]>({
    queryKey: ["/api/disciplines", selectedDisciplineId, "categories"],
    queryFn: async () => {
      const res = await fetch(`/api/disciplines/${selectedDisciplineId}/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    enabled: selectedDisciplineId != null,
  });

  const handleDisciplineChange = (value: string) => {
    const id = parseInt(value);
    // Changing discipline resets selected categories
    onChange(isNaN(id) ? null : id, []);
  };

  const handleToggleCategory = (categoryId: number) => {
    if (selectedCategoryIds.includes(categoryId)) {
      onChange(selectedDisciplineId, selectedCategoryIds.filter((id) => id !== categoryId));
    } else if (selectedCategoryIds.length < maxCategories) {
      onChange(selectedDisciplineId, [...selectedCategoryIds, categoryId]);
    }
  };

  const handleRemoveCategory = (categoryId: number) => {
    onChange(selectedDisciplineId, selectedCategoryIds.filter((id) => id !== categoryId));
  };

  const selectedCategories = (categories || []).filter((c) => selectedCategoryIds.includes(c.id));

  return (
    <div className="space-y-4">
      <div>
        <Label>Discipline *</Label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Choose the discipline that best fits your expertise
        </p>
      </div>

      <Select
        value={selectedDisciplineId != null ? String(selectedDisciplineId) : ""}
        onValueChange={handleDisciplineChange}
        disabled={disciplinesLoading}
      >
        <SelectTrigger data-testid="select-discipline">
          <SelectValue placeholder={disciplinesLoading ? "Loading..." : "Select a discipline"} />
        </SelectTrigger>
        <SelectContent>
          {(disciplines || []).map((d) => (
            <SelectItem key={d.id} value={String(d.id)}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedDisciplineId != null && (
        <div className="space-y-3">
          <div>
            <Label>Topics (Select up to {maxCategories})</Label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Pick the topics within this discipline that match your expertise
            </p>
          </div>

          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100 w-full mb-1">
                Selected ({selectedCategories.length}/{maxCategories}):
              </span>
              {selectedCategories.map((cat) => (
                <Badge key={cat.id} variant="secondary" className="gap-1 pr-1">
                  {cat.name}
                  <button
                    type="button"
                    data-testid={`remove-category-${cat.id}`}
                    onClick={() => handleRemoveCategory(cat.id)}
                    className="ml-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <ScrollArea className="h-[260px] border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
            {categoriesLoading ? (
              <div className="text-center text-gray-500 py-8">Loading topics...</div>
            ) : (categories || []).length === 0 ? (
              <div className="text-center text-gray-500 py-8">No topics found</div>
            ) : (
              <div className="space-y-2">
                {(categories || []).map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  const isDisabled = !isSelected && selectedCategoryIds.length >= maxCategories;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      data-testid={`category-option-${cat.id}`}
                      onClick={() => !isDisabled && handleToggleCategory(cat.id)}
                      disabled={isDisabled}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between gap-2",
                        isSelected && "bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600",
                        !isSelected && !isDisabled && "hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600",
                        isDisabled && "opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700"
                      )}
                    >
                      <span className="font-medium text-sm">{cat.name}</span>
                      {isSelected && <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default DisciplineCategorySelector;

interface DisciplineSummaryProps {
  disciplineId: number | null;
  categoryIds: number[];
}

export function DisciplineSummary({ disciplineId, categoryIds }: DisciplineSummaryProps) {
  const { data: disciplines } = useQuery<DisciplineWithCounts[]>({
    queryKey: ["/api/disciplines"],
  });

  const { data: categories } = useQuery<CategoryItem[]>({
    queryKey: ["/api/disciplines", disciplineId, "categories"],
    queryFn: async () => {
      const res = await fetch(`/api/disciplines/${disciplineId}/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    enabled: disciplineId != null,
  });

  const discipline = (disciplines || []).find((d) => d.id === disciplineId);
  const selectedCategories = (categories || []).filter((c) => categoryIds.includes(c.id));

  if (disciplineId == null || !discipline) {
    return (
      <p className="text-sm text-muted-foreground">
        No discipline selected yet. Click Edit to choose your discipline and topics.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">Discipline</p>
        <Badge className="bg-primary text-white hover:bg-primary/90">{discipline.name}</Badge>
      </div>
      {selectedCategories.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Topics</p>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((cat) => (
              <Badge key={cat.id} variant="outline">
                {cat.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
