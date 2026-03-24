import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";

interface TierAssignment {
  id?: number;
  tier: string;
  sortOrder: number;
  isHighlighted: boolean;
}

interface SubscriptionFeature {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  createdAt: Date;
  tiers: TierAssignment[];
}

export function SubscriptionFeaturesManager() {
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<SubscriptionFeature | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    tiers: [] as TierAssignment[],
  });
  const [newFeature, setNewFeature] = useState({
    slug: "",
    name: "",
    description: "",
    tier: "basic",
    sortOrder: 0,
    isHighlighted: false,
  });

  const { data: features = [], isLoading } = useQuery<SubscriptionFeature[]>({
    queryKey: ["/api/admin/subscription-features"],
  });

  const createFeatureMutation = useMutation({
    mutationFn: async (featureData: typeof newFeature) => {
      const response = await fetch("/api/admin/subscription-features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: featureData.slug,
          name: featureData.name,
          description: featureData.description,
        }),
      });
      if (!response.ok) throw new Error("Failed to create feature");
      const created = await response.json();

      const tierResponse = await fetch(`/api/admin/subscription-features/${created.id}/assign-tier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: featureData.tier,
          sortOrder: featureData.sortOrder,
          isHighlighted: featureData.isHighlighted,
        }),
      });
      if (!tierResponse.ok) throw new Error("Failed to assign feature to tier");
      return created;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Feature created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-features"] });
      setIsAddDialogOpen(false);
      setNewFeature({ slug: "", name: "", description: "", tier: "basic", sortOrder: 0, isHighlighted: false });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create feature", variant: "destructive" });
    },
  });

  const updateFeatureMutation = useMutation({
    mutationFn: async ({ id, data, tierChanges }: { id: number; data: { name: string; description: string }; tierChanges: { add: TierAssignment[]; remove: number[] } }) => {
      const response = await fetch(`/api/admin/subscription-features/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update feature");

      for (const tierId of tierChanges.remove) {
        const delRes = await fetch(`/api/admin/tier-features/${tierId}`, { method: "DELETE" });
        if (!delRes.ok) throw new Error("Failed to remove tier assignment");
      }

      for (const tier of tierChanges.add) {
        const addRes = await fetch(`/api/admin/subscription-features/${id}/assign-tier`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: tier.tier, sortOrder: tier.sortOrder, isHighlighted: tier.isHighlighted }),
        });
        if (!addRes.ok) throw new Error("Failed to add tier assignment");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Feature updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-features"] });
      setEditingFeature(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update feature", variant: "destructive" });
    },
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/subscription-features/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete feature");
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Feature deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-features"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete feature", variant: "destructive" });
    },
  });

  const openEditDialog = (feature: SubscriptionFeature) => {
    setEditingFeature(feature);
    setEditForm({
      name: feature.name,
      description: feature.description || "",
      tiers: feature.tiers.map(t => ({ ...t })),
    });
  };

  const handleEditSave = () => {
    if (!editingFeature) return;

    const originalTierNames = new Set(editingFeature.tiers.map(t => t.tier));
    const newTierNames = new Set(editForm.tiers.map(t => t.tier));

    const toRemove = editingFeature.tiers
      .filter(t => !newTierNames.has(t.tier) && t.id)
      .map(t => t.id!);

    const toAdd = editForm.tiers.filter(t => !originalTierNames.has(t.tier));

    updateFeatureMutation.mutate({
      id: editingFeature.id,
      data: { name: editForm.name, description: editForm.description },
      tierChanges: { add: toAdd, remove: toRemove },
    });
  };

  const addTierToEdit = (tier: string) => {
    if (editForm.tiers.some(t => t.tier === tier)) return;
    setEditForm({
      ...editForm,
      tiers: [...editForm.tiers, { tier, sortOrder: 0, isHighlighted: false }],
    });
  };

  const removeTierFromEdit = (tier: string) => {
    setEditForm({
      ...editForm,
      tiers: editForm.tiers.filter(t => t.tier !== tier),
    });
  };

  const toggleTierHighlight = (tier: string) => {
    setEditForm({
      ...editForm,
      tiers: editForm.tiers.map(t =>
        t.tier === tier ? { ...t, isHighlighted: !t.isHighlighted } : t
      ),
    });
  };

  const filteredFeatures = selectedTier === "all"
    ? features
    : features.filter(f => f.tiers.some(t => t.tier === selectedTier));

  const allTiers = ["basic", "pro", "premier"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscription Features Management</h2>
          <p className="text-muted-foreground">
            Manage features available for each subscription tier
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-feature">
          <Plus className="h-4 w-4 mr-2" />
          Add Feature
        </Button>
      </div>

      <div className="flex gap-2">
        {["all", "basic", "pro", "premier"].map((tier) => (
          <Button
            key={tier}
            variant={selectedTier === tier ? "default" : "outline"}
            onClick={() => setSelectedTier(tier)}
            data-testid={`button-filter-${tier}`}
          >
            {tier === "all" ? "All Tiers" : tier.charAt(0).toUpperCase() + tier.slice(1)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p>Loading features...</p>
      ) : (
        <div className="grid gap-4">
          {filteredFeatures.map((feature) => (
            <Card key={feature.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{feature.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {feature.description || "No description"}
                    </CardDescription>
                    <div className="flex gap-2 mt-3">
                      {feature.tiers.map((tier, idx) => (
                        <Badge
                          key={idx}
                          variant={tier.isHighlighted ? "default" : "outline"}
                          data-testid={`badge-tier-${tier.tier}`}
                        >
                          {tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1)}
                          {tier.isHighlighted && " ⭐"}
                        </Badge>
                      ))}
                      {feature.tiers.length === 0 && (
                        <Badge variant="secondary">No tiers assigned</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(feature)}
                      data-testid={`button-edit-${feature.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Delete "${feature.name}"? This cannot be undone.`)) {
                          deleteFeatureMutation.mutate(feature.id);
                        }
                      }}
                      data-testid={`button-delete-${feature.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
          {filteredFeatures.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No features found for this filter.</p>
          )}
        </div>
      )}

      {/* Add Feature Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Feature</DialogTitle>
            <DialogDescription>
              Create a new feature and assign it to a subscription tier
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="slug">Feature Slug</Label>
              <Input
                id="slug"
                value={newFeature.slug}
                onChange={(e) => setNewFeature({ ...newFeature, slug: e.target.value })}
                placeholder="feature-slug"
                data-testid="input-feature-slug"
              />
            </div>
            <div>
              <Label htmlFor="name">Feature Name</Label>
              <Input
                id="name"
                value={newFeature.name}
                onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                placeholder="Feature Name"
                data-testid="input-feature-name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newFeature.description}
                onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                placeholder="Feature description"
                data-testid="input-feature-description"
              />
            </div>
            <div>
              <Label htmlFor="tier">Tier</Label>
              <Select value={newFeature.tier} onValueChange={(value) => setNewFeature({ ...newFeature, tier: value })}>
                <SelectTrigger data-testid="select-feature-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="premier">Premier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="highlighted"
                checked={newFeature.isHighlighted}
                onCheckedChange={(checked) => setNewFeature({ ...newFeature, isHighlighted: checked })}
                data-testid="switch-feature-highlighted"
              />
              <Label htmlFor="highlighted">Highlighted Feature</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} data-testid="button-cancel-add">
                Cancel
              </Button>
              <Button
                onClick={() => createFeatureMutation.mutate(newFeature)}
                disabled={!newFeature.slug || !newFeature.name || createFeatureMutation.isPending}
                data-testid="button-save-feature"
              >
                {createFeatureMutation.isPending ? "Creating..." : "Create Feature"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Feature Dialog */}
      <Dialog open={!!editingFeature} onOpenChange={(open) => { if (!open) setEditingFeature(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Feature</DialogTitle>
            <DialogDescription>
              Update feature details and tier assignments
            </DialogDescription>
          </DialogHeader>
          {editingFeature && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="edit-name">Feature Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              <div>
                <Label className="mb-2 block">Assigned Tiers</Label>
                <div className="space-y-2">
                  {editForm.tiers.map((tier) => (
                    <div key={tier.tier} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                      <span className="font-medium text-sm">
                        {tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1)}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Switch
                            checked={tier.isHighlighted}
                            onCheckedChange={() => toggleTierHighlight(tier.tier)}
                            className="scale-75"
                          />
                          <span className="text-xs text-muted-foreground">Highlight</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTierFromEdit(tier.tier)}
                          className="h-7 px-2 text-destructive hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {editForm.tiers.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No tiers assigned</p>
                  )}
                </div>

                {allTiers.filter(t => !editForm.tiers.some(et => et.tier === t)).length > 0 && (
                  <div className="mt-3 flex gap-2 items-center">
                    <span className="text-sm text-muted-foreground">Add:</span>
                    {allTiers
                      .filter(t => !editForm.tiers.some(et => et.tier === t))
                      .map(tier => (
                        <Button
                          key={tier}
                          variant="outline"
                          size="sm"
                          onClick={() => addTierToEdit(tier)}
                          className="h-7 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {tier.charAt(0).toUpperCase() + tier.slice(1)}
                        </Button>
                      ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingFeature(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleEditSave}
                  disabled={!editForm.name || updateFeatureMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateFeatureMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
