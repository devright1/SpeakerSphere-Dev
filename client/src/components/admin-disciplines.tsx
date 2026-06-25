import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ChevronDown, ChevronUp, RefreshCw, Save } from "lucide-react";

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

interface FlaggedSpeaker {
  id: number;
  name: string;
  categories: string[] | null;
  disciplineId: number | null;
  speakerCategoryIds: number[] | null;
  disciplineMigrationStatus: string | null;
}

function CategoriesEditor({ disciplineId }: { disciplineId: number }) {
  const { toast } = useToast();
  const [newCategoryName, setNewCategoryName] = useState("");

  const { data: categories, isLoading } = useQuery<CategoryItem[]>({
    queryKey: ["/api/disciplines", disciplineId, "categories"],
    queryFn: async () => {
      const res = await fetch(`/api/disciplines/${disciplineId}/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/disciplines/${disciplineId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: "" }),
      });
      if (!res.ok) throw new Error("Failed to add category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disciplines", disciplineId, "categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/disciplines"] });
      setNewCategoryName("");
      toast({ title: "Category added" });
    },
    onError: () => {
      toast({ title: "Failed to add category", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-3 pt-3">
      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          <span className="text-sm text-muted-foreground">Loading categories...</span>
        ) : (categories || []).length === 0 ? (
          <span className="text-sm text-muted-foreground">No categories yet</span>
        ) : (
          (categories || []).map((cat) => (
            <Badge key={cat.id} variant="outline" data-testid={`category-badge-${cat.id}`}>
              {cat.name}
            </Badge>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="New category name"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          data-testid={`input-new-category-${disciplineId}`}
        />
        <Button
          size="sm"
          onClick={() => {
            if (newCategoryName.trim()) addCategoryMutation.mutate(newCategoryName.trim());
          }}
          disabled={addCategoryMutation.isPending || !newCategoryName.trim()}
          data-testid={`button-add-category-${disciplineId}`}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}

function MigrationReview({ disciplines }: { disciplines: DisciplineWithCounts[] }) {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Record<number, number | null>>({});

  const { data: flaggedSpeakers, isLoading } = useQuery<FlaggedSpeaker[]>({
    queryKey: ["/api/admin/migration-review"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/migration-review?status=flagged`);
      if (!res.ok) throw new Error("Failed to fetch migration review");
      return res.json();
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ speakerId, disciplineId }: { speakerId: number; disciplineId: number }) => {
      const res = await fetch(`/api/speakers/${speakerId}/discipline`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disciplineId, categoryIds: [], status: "confirmed" }),
      });
      if (!res.ok) throw new Error("Failed to assign discipline");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/migration-review"] });
      queryClient.invalidateQueries({ queryKey: ["/api/disciplines"] });
      toast({ title: "Speaker assigned to discipline" });
    },
    onError: () => {
      toast({ title: "Failed to assign discipline", variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Migration Review</CardTitle>
        <p className="text-sm text-muted-foreground">
          Speakers that could not be automatically matched to a discipline. Assign each one manually.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (flaggedSpeakers || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No speakers need review.</p>
        ) : (
          <div className="space-y-3">
            {(flaggedSpeakers || []).map((speaker) => (
              <div
                key={speaker.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg"
                data-testid={`flagged-speaker-${speaker.id}`}
              >
                <div className="flex-1">
                  <p className="font-medium">{speaker.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(speaker.categories || []).map((cat, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={assignments[speaker.id] != null ? String(assignments[speaker.id]) : ""}
                    onValueChange={(value) =>
                      setAssignments((prev) => ({ ...prev, [speaker.id]: parseInt(value) }))
                    }
                  >
                    <SelectTrigger className="w-[220px]" data-testid={`select-assign-${speaker.id}`}>
                      <SelectValue placeholder="Select discipline" />
                    </SelectTrigger>
                    <SelectContent>
                      {disciplines.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => {
                      const disciplineId = assignments[speaker.id];
                      if (disciplineId == null) {
                        toast({ title: "Select a discipline first", variant: "destructive" });
                        return;
                      }
                      assignMutation.mutate({ speakerId: speaker.id, disciplineId });
                    }}
                    disabled={assignMutation.isPending}
                    data-testid={`button-assign-${speaker.id}`}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Assign
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminDisciplines() {
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [newDisciplineName, setNewDisciplineName] = useState("");
  const [newDisciplineDescription, setNewDisciplineDescription] = useState("");

  const { data: disciplines, isLoading } = useQuery<DisciplineWithCounts[]>({
    queryKey: ["/api/disciplines"],
  });

  const addDisciplineMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const res = await fetch(`/api/disciplines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error("Failed to add discipline");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disciplines"] });
      setNewDisciplineName("");
      setNewDisciplineDescription("");
      toast({ title: "Discipline added" });
    },
    onError: () => {
      toast({ title: "Failed to add discipline", variant: "destructive" });
    },
  });

  const runMigrationMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/migrate-disciplines`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to run migration");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disciplines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/migration-review"] });
      toast({ title: "Migration complete" });
    },
    onError: () => {
      toast({ title: "Migration failed", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Disciplines</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runMigrationMutation.mutate()}
              disabled={runMigrationMutation.isPending}
              data-testid="button-run-migration"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              {runMigrationMutation.isPending ? "Running..." : "Re-run Migration"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new discipline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 border rounded-lg bg-slate-50">
            <div>
              <Label htmlFor="new-discipline-name">New Discipline Name</Label>
              <Input
                id="new-discipline-name"
                value={newDisciplineName}
                onChange={(e) => setNewDisciplineName(e.target.value)}
                placeholder="e.g. Cardiology"
                data-testid="input-new-discipline-name"
              />
            </div>
            <div>
              <Label htmlFor="new-discipline-description">Description (optional)</Label>
              <Textarea
                id="new-discipline-description"
                value={newDisciplineDescription}
                onChange={(e) => setNewDisciplineDescription(e.target.value)}
                rows={1}
                data-testid="input-new-discipline-description"
              />
            </div>
            <div className="sm:col-span-2">
              <Button
                onClick={() => {
                  if (newDisciplineName.trim()) {
                    addDisciplineMutation.mutate({
                      name: newDisciplineName.trim(),
                      description: newDisciplineDescription.trim(),
                    });
                  }
                }}
                disabled={addDisciplineMutation.isPending || !newDisciplineName.trim()}
                data-testid="button-add-discipline"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Discipline
              </Button>
            </div>
          </div>

          {/* Disciplines list */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading disciplines...</p>
          ) : (
            <div className="space-y-2">
              {(disciplines || [])
                .slice()
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                .map((d) => (
                  <div key={d.id} className="border rounded-lg" data-testid={`discipline-row-${d.id}`}>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                    >
                      <div className="text-left">
                        <p className="font-medium">{d.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.categoryCount} categories · {d.speakerCount} speakers
                        </p>
                      </div>
                      {expandedId === d.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {expandedId === d.id && (
                      <div className="px-3 pb-3 border-t">
                        <CategoriesEditor disciplineId={d.id} />
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <MigrationReview disciplines={disciplines || []} />
    </div>
  );
}
