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
import { Plus, ChevronDown, ChevronUp, RefreshCw, Save, Pencil, Trash2, X, Check, CheckCheck } from "lucide-react";

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

// Build headers that include admin auth (X-Admin-Email) when the admin is logged in.
function adminHeaders(json = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  const adminAuthenticated = localStorage.getItem("adminAuthenticated");
  const adminEmail = localStorage.getItem("adminEmail");
  if (adminAuthenticated === "true" && adminEmail) {
    headers["X-Admin-Email"] = adminEmail;
  }
  return headers;
}

async function adminRequest(method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: adminHeaders(body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    let message = "Request failed";
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return res.json();
}

function CategoriesEditor({ disciplineId }: { disciplineId: number }) {
  const { toast } = useToast();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const { data: categories, isLoading } = useQuery<CategoryItem[]>({
    queryKey: ["/api/disciplines", disciplineId, "categories"],
    queryFn: async () => {
      const res = await fetch(`/api/disciplines/${disciplineId}/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/disciplines", disciplineId, "categories"] });
    queryClient.invalidateQueries({ queryKey: ["/api/disciplines"] });
  };

  const addCategoryMutation = useMutation({
    mutationFn: (name: string) =>
      adminRequest("POST", `/api/disciplines/${disciplineId}/categories`, { name, description: "" }),
    onSuccess: () => {
      invalidate();
      setNewCategoryName("");
      toast({ title: "Category added" });
    },
    onError: (e: Error) => toast({ title: e.message || "Failed to add category", variant: "destructive" }),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      adminRequest("PUT", `/api/categories/${id}`, { name }),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
      setEditingName("");
      toast({ title: "Category updated" });
    },
    onError: (e: Error) => toast({ title: e.message || "Failed to update category", variant: "destructive" }),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => adminRequest("DELETE", `/api/categories/${id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Category deleted" });
    },
    onError: (e: Error) => toast({ title: e.message || "Failed to delete category", variant: "destructive" }),
  });

  return (
    <div className="space-y-3 pt-3">
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <span className="text-sm text-muted-foreground">Loading categories...</span>
        ) : (categories || []).length === 0 ? (
          <span className="text-sm text-muted-foreground">No categories yet</span>
        ) : (
          (categories || []).map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
              data-testid={`category-row-${cat.id}`}
            >
              {editingId === cat.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-8"
                    data-testid={`input-edit-category-${cat.id}`}
                  />
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        if (editingName.trim())
                          updateCategoryMutation.mutate({ id: cat.id, name: editingName.trim() });
                      }}
                      disabled={updateCategoryMutation.isPending || !editingName.trim()}
                      data-testid={`button-save-category-${cat.id}`}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingId(null);
                        setEditingName("");
                      }}
                      data-testid={`button-cancel-category-${cat.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-sm">{cat.name}</span>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditingName(cat.name);
                      }}
                      data-testid={`button-edit-category-${cat.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => {
                        if (confirm(`Delete category "${cat.name}"?`)) deleteCategoryMutation.mutate(cat.id);
                      }}
                      disabled={deleteCategoryMutation.isPending}
                      data-testid={`button-delete-category-${cat.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
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

function SpeakerReviewRow({
  speaker,
  disciplines,
}: {
  speaker: FlaggedSpeaker;
  disciplines: DisciplineWithCounts[];
}) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<number | null>(speaker.disciplineId ?? null);

  const assignMutation = useMutation({
    mutationFn: (disciplineId: number) =>
      adminRequest("PUT", `/api/speakers/${speaker.id}/discipline`, {
        disciplineId,
        categoryIds: [],
        status: "confirmed",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/migration-review"] });
      queryClient.invalidateQueries({ queryKey: ["/api/disciplines"] });
      toast({ title: "Speaker discipline confirmed" });
    },
    onError: (e: Error) => toast({ title: e.message || "Failed to assign discipline", variant: "destructive" }),
  });

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg"
      data-testid={`review-speaker-${speaker.id}`}
    >
      <div className="flex-1">
        <p className="font-medium">{speaker.name}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {(speaker.categories || []).length === 0 ? (
            <span className="text-xs text-muted-foreground">No legacy categories</span>
          ) : (
            (speaker.categories || []).map((cat, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {cat}
              </Badge>
            ))
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={selected != null ? String(selected) : ""}
          onValueChange={(value) => setSelected(parseInt(value))}
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
            if (selected == null) {
              toast({ title: "Select a discipline first", variant: "destructive" });
              return;
            }
            assignMutation.mutate(selected);
          }}
          disabled={assignMutation.isPending}
          data-testid={`button-assign-${speaker.id}`}
        >
          <Save className="h-4 w-4 mr-1" />
          Confirm
        </Button>
      </div>
    </div>
  );
}

function MigrationReview({ disciplines }: { disciplines: DisciplineWithCounts[] }) {
  const { toast } = useToast();

  const { data: flaggedSpeakers, isLoading: flaggedLoading } = useQuery<FlaggedSpeaker[]>({
    queryKey: ["/api/admin/migration-review", "flagged"],
    queryFn: () => adminRequest("GET", `/api/admin/migration-review?status=flagged`),
  });

  const { data: autoSpeakers, isLoading: autoLoading } = useQuery<FlaggedSpeaker[]>({
    queryKey: ["/api/admin/migration-review", "auto"],
    queryFn: () => adminRequest("GET", `/api/admin/migration-review?status=auto`),
  });

  const confirmAllAutoMutation = useMutation({
    mutationFn: () => adminRequest("POST", `/api/admin/migration-review/confirm-auto`, {}),
    onSuccess: (data: { confirmed?: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/migration-review"] });
      toast({ title: `Confirmed ${data.confirmed ?? "all"} auto-matched speakers` });
    },
    onError: (e: Error) => toast({ title: e.message || "Failed to confirm", variant: "destructive" }),
  });

  const disciplineName = (id: number | null) =>
    disciplines.find((d) => d.id === id)?.name || "Unknown";

  return (
    <div className="space-y-6">
      {/* Flagged: could not be auto-matched */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Needs Review</CardTitle>
          <p className="text-sm text-muted-foreground">
            Speakers that could not be automatically matched to a discipline. Assign each one manually.
          </p>
        </CardHeader>
        <CardContent>
          {flaggedLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (flaggedSpeakers || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No speakers need review.</p>
          ) : (
            <div className="space-y-3">
              {(flaggedSpeakers || []).map((speaker) => (
                <SpeakerReviewRow key={speaker.id} speaker={speaker} disciplines={disciplines} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto: matched automatically, awaiting confirmation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Auto-matched (confirm or reassign)</span>
            {(autoSpeakers || []).length > 0 && (
              <Button
                size="sm"
                onClick={() => confirmAllAutoMutation.mutate()}
                disabled={confirmAllAutoMutation.isPending}
                data-testid="button-confirm-all-auto"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                {confirmAllAutoMutation.isPending ? "Confirming..." : "Confirm All Auto"}
              </Button>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Speakers automatically matched to a discipline. Confirm them in bulk, or reassign any that look wrong.
          </p>
        </CardHeader>
        <CardContent>
          {autoLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (autoSpeakers || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No auto-matched speakers awaiting confirmation.</p>
          ) : (
            <div className="space-y-3">
              {(autoSpeakers || []).map((speaker) => (
                <div key={speaker.id} className="space-y-1">
                  <p className="text-xs text-muted-foreground pl-1">
                    Auto-matched to: <span className="font-medium">{disciplineName(speaker.disciplineId)}</span>
                  </p>
                  <SpeakerReviewRow speaker={speaker} disciplines={disciplines} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminDisciplines() {
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [newDisciplineName, setNewDisciplineName] = useState("");
  const [newDisciplineDescription, setNewDisciplineDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const { data: disciplines, isLoading } = useQuery<DisciplineWithCounts[]>({
    queryKey: ["/api/disciplines"],
  });

  const addDisciplineMutation = useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) =>
      adminRequest("POST", `/api/disciplines`, { name, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disciplines"] });
      setNewDisciplineName("");
      setNewDisciplineDescription("");
      toast({ title: "Discipline added" });
    },
    onError: (e: Error) => toast({ title: e.message || "Failed to add discipline", variant: "destructive" }),
  });

  const updateDisciplineMutation = useMutation({
    mutationFn: ({ id, name, description }: { id: number; name: string; description: string }) =>
      adminRequest("PUT", `/api/disciplines/${id}`, { name, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disciplines"] });
      setEditingId(null);
      toast({ title: "Discipline updated" });
    },
    onError: (e: Error) => toast({ title: e.message || "Failed to update discipline", variant: "destructive" }),
  });

  const deleteDisciplineMutation = useMutation({
    mutationFn: (id: number) => adminRequest("DELETE", `/api/disciplines/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disciplines"] });
      toast({ title: "Discipline deleted" });
    },
    onError: (e: Error) => toast({ title: e.message || "Failed to delete discipline", variant: "destructive" }),
  });

  const runMigrationMutation = useMutation({
    mutationFn: () => adminRequest("POST", `/api/admin/migrate-disciplines`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disciplines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/migration-review"] });
      toast({ title: "Migration complete" });
    },
    onError: (e: Error) => toast({ title: e.message || "Migration failed", variant: "destructive" }),
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
                    {editingId === d.id ? (
                      <div className="p-3 space-y-2 bg-slate-50">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Discipline name"
                          data-testid={`input-edit-discipline-name-${d.id}`}
                        />
                        <Textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={1}
                          placeholder="Description (optional)"
                          data-testid={`input-edit-discipline-description-${d.id}`}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              if (editName.trim())
                                updateDisciplineMutation.mutate({
                                  id: d.id,
                                  name: editName.trim(),
                                  description: editDescription.trim(),
                                });
                            }}
                            disabled={updateDisciplineMutation.isPending || !editName.trim()}
                            data-testid={`button-save-discipline-${d.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                            data-testid={`button-cancel-discipline-${d.id}`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                        <button
                          type="button"
                          className="flex-1 text-left"
                          onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                        >
                          <p className="font-medium">{d.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {d.categoryCount} categories · {d.speakerCount} speakers
                          </p>
                        </button>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingId(d.id);
                              setEditName(d.name);
                              setEditDescription(d.description || "");
                            }}
                            data-testid={`button-edit-discipline-${d.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              if (
                                confirm(
                                  `Delete discipline "${d.name}"? Its categories will also be removed.`
                                )
                              )
                                deleteDisciplineMutation.mutate(d.id);
                            }}
                            disabled={deleteDisciplineMutation.isPending}
                            data-testid={`button-delete-discipline-${d.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <button
                            type="button"
                            className="ml-1"
                            onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                            data-testid={`button-expand-discipline-${d.id}`}
                          >
                            {expandedId === d.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    {expandedId === d.id && editingId !== d.id && (
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
