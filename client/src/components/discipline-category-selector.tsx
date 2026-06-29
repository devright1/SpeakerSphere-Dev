import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, X, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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

// ── Internal block type ───────────────────────────────────────────────────────
type Block = { disciplineId: number | null; categoryIds: number[] };

// ── Single discipline block ───────────────────────────────────────────────────
interface DisciplineBlockProps {
  block: Block;
  blockIndex: number;
  allDisciplines: DisciplineWithCounts[];
  usedDisciplineIds: number[];
  topicsPerDiscipline: number;
  onDisciplineChange: (newDisciplineId: number) => void;
  onCategoryToggle: (categoryId: number) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function DisciplineBlock({
  block,
  blockIndex,
  allDisciplines,
  usedDisciplineIds,
  topicsPerDiscipline,
  onDisciplineChange,
  onCategoryToggle,
  onRemove,
  canRemove,
}: DisciplineBlockProps) {
  const { data: categories, isLoading } = useQuery<CategoryItem[]>({
    queryKey: ["/api/disciplines", block.disciplineId, "categories"],
    queryFn: async () => {
      const res = await fetch(`/api/disciplines/${block.disciplineId}/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    enabled: block.disciplineId != null,
  });

  const atLimit = block.categoryIds.length >= topicsPerDiscipline;
  const selectedCats = (categories || []).filter((c) => block.categoryIds.includes(c.id));

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-slate-50 dark:bg-slate-800/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Discipline {blockIndex + 1}
        </span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Select
        value={block.disciplineId != null ? String(block.disciplineId) : ""}
        onValueChange={(v) => onDisciplineChange(parseInt(v))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a discipline…" />
        </SelectTrigger>
        <SelectContent>
          {allDisciplines.map((d) => (
            <SelectItem
              key={d.id}
              value={String(d.id)}
              disabled={usedDisciplineIds.includes(d.id)}
            >
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {block.disciplineId != null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-slate-600 dark:text-slate-400">
              Topics within this discipline
            </Label>
            <span
              className={cn(
                "text-xs font-medium",
                atLimit ? "text-amber-600" : "text-slate-500"
              )}
            >
              {block.categoryIds.length} / {topicsPerDiscipline}
              {atLimit && " — limit reached"}
            </span>
          </div>

          {selectedCats.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              {selectedCats.map((cat) => (
                <Badge key={cat.id} variant="secondary" className="gap-1 pr-1 text-xs">
                  {cat.name}
                  <button
                    type="button"
                    onClick={() => onCategoryToggle(cat.id)}
                    className="ml-0.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 p-0.5"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <ScrollArea className="h-[200px] border rounded-lg p-3 bg-white dark:bg-slate-900">
            {isLoading ? (
              <div className="text-center text-gray-500 py-8 text-sm">Loading topics…</div>
            ) : (categories || []).length === 0 ? (
              <div className="text-center text-gray-500 py-8 text-sm">No topics available</div>
            ) : (
              <div className="space-y-1.5">
                {(categories || []).map((cat) => {
                  const isSelected = block.categoryIds.includes(cat.id);
                  const isDisabled = !isSelected && atLimit;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      data-testid={`category-option-${cat.id}`}
                      onClick={() => !isDisabled && onCategoryToggle(cat.id)}
                      disabled={isDisabled}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg border text-sm transition-all flex items-center justify-between gap-2",
                        isSelected &&
                          "bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600",
                        !isSelected &&
                          !isDisabled &&
                          "hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600",
                        isDisabled &&
                          "opacity-40 cursor-not-allowed border-gray-100 dark:border-gray-800"
                      )}
                    >
                      <span className="font-medium">{cat.name}</span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

// ── Multi-discipline selector ─────────────────────────────────────────────────
export interface MultiDisciplineSelectorProps {
  selectedDisciplineIds: number[];
  selectedCategoryIds: number[];
  onChange: (disciplineIds: number[], categoryIds: number[]) => void;
  maxDisciplines: number;
  topicsPerDiscipline: number;
  error?: string;
}

export function MultiDisciplineSelector({
  selectedDisciplineIds,
  selectedCategoryIds,
  onChange,
  maxDisciplines,
  topicsPerDiscipline,
  error,
}: MultiDisciplineSelectorProps) {
  const { data: allDisciplines = [] } = useQuery<DisciplineWithCounts[]>({
    queryKey: ["/api/disciplines"],
  });

  const [blocks, setBlocks] = useState<Block[]>(() => {
    if (selectedDisciplineIds.length === 0) return [{ disciplineId: null, categoryIds: [] }];
    return selectedDisciplineIds.map((dId) => ({ disciplineId: dId, categoryIds: [] }));
  });

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    if (selectedDisciplineIds.length === 0) {
      setInitialized(true);
      return;
    }
    if (selectedCategoryIds.length === 0) {
      setBlocks(selectedDisciplineIds.map((dId) => ({ disciplineId: dId, categoryIds: [] })));
      setInitialized(true);
      return;
    }
    Promise.all(
      selectedDisciplineIds.map((dId) =>
        fetch(`/api/disciplines/${dId}/categories`)
          .then((r) => r.json() as Promise<CategoryItem[]>)
          .catch(() => [] as CategoryItem[])
      )
    ).then((results) => {
      const newBlocks = selectedDisciplineIds.map((dId, i) => {
        const catIdSet = new Set(results[i].map((c) => c.id));
        return {
          disciplineId: dId,
          categoryIds: selectedCategoryIds.filter((id) => catIdSet.has(id)),
        };
      });
      setBlocks(newBlocks);
      setInitialized(true);
    });
  }, [selectedDisciplineIds.join(","), initialized]);

  const emit = (newBlocks: Block[]) => {
    const disciplineIds = newBlocks
      .map((b) => b.disciplineId)
      .filter((d): d is number => d !== null);
    const categoryIds = newBlocks.flatMap((b) => b.categoryIds);
    onChange(disciplineIds, categoryIds);
  };

  const handleDisciplineChange = (blockIndex: number, newDisciplineId: number) => {
    const newBlocks = blocks.map((b, i) =>
      i === blockIndex ? { disciplineId: newDisciplineId, categoryIds: [] } : b
    );
    setBlocks(newBlocks);
    emit(newBlocks);
  };

  const handleCategoryToggle = (blockIndex: number, categoryId: number) => {
    const block = blocks[blockIndex];
    const isSelected = block.categoryIds.includes(categoryId);
    if (!isSelected && block.categoryIds.length >= topicsPerDiscipline) return;
    const newCategoryIds = isSelected
      ? block.categoryIds.filter((id) => id !== categoryId)
      : [...block.categoryIds, categoryId];
    const newBlocks = blocks.map((b, i) =>
      i === blockIndex ? { ...b, categoryIds: newCategoryIds } : b
    );
    setBlocks(newBlocks);
    emit(newBlocks);
  };

  const handleRemoveBlock = (blockIndex: number) => {
    const newBlocks = blocks.filter((_, i) => i !== blockIndex);
    if (newBlocks.length === 0) {
      const empty = [{ disciplineId: null, categoryIds: [] }];
      setBlocks(empty);
      onChange([], []);
    } else {
      setBlocks(newBlocks);
      emit(newBlocks);
    }
  };

  const handleAddDiscipline = () => {
    setBlocks([...blocks, { disciplineId: null, categoryIds: [] }]);
  };

  const usedDisciplineIds = blocks
    .map((b) => b.disciplineId)
    .filter((d): d is number => d !== null);

  const confirmedDisciplineCount = blocks.filter((b) => b.disciplineId !== null).length;
  const hasEmptyBlock = blocks.some((b) => b.disciplineId === null);
  const canAddMore = confirmedDisciplineCount < maxDisciplines && !hasEmptyBlock;

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => (
        <DisciplineBlock
          key={i}
          block={block}
          blockIndex={i}
          allDisciplines={allDisciplines}
          usedDisciplineIds={usedDisciplineIds.filter((id) => id !== block.disciplineId)}
          topicsPerDiscipline={topicsPerDiscipline}
          onDisciplineChange={(newDId) => handleDisciplineChange(i, newDId)}
          onCategoryToggle={(catId) => handleCategoryToggle(i, catId)}
          onRemove={() => handleRemoveBlock(i)}
          canRemove={blocks.length > 1 || block.disciplineId !== null}
        />
      ))}

      {canAddMore && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddDiscipline}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Discipline ({confirmedDisciplineCount} / {maxDisciplines})
        </Button>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default MultiDisciplineSelector;

// ── DisciplineSummary (view-only) ─────────────────────────────────────────────
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

// ── DisciplineCategorySelector (backward-compat single-discipline wrapper) ────
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
  return (
    <MultiDisciplineSelector
      selectedDisciplineIds={selectedDisciplineId != null ? [selectedDisciplineId] : []}
      selectedCategoryIds={selectedCategoryIds}
      onChange={(disciplineIds, categoryIds) => {
        onChange(disciplineIds[0] ?? null, categoryIds);
      }}
      maxDisciplines={1}
      topicsPerDiscipline={maxCategories}
      error={error}
    />
  );
}
