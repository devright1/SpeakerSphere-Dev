import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
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

interface SubscriptionFeature {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  createdAt: Date;
  tiers: Array<{
    tier: string;
    sortOrder: number;
    isHighlighted: boolean;
  }>;
}

export function SubscriptionFeaturesManager() {
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<SubscriptionFeature | null>(null);
  const [newFeature, setNewFeature] = useState({
    slug: "",
    name: "",
    description: "",
    tier: "basic",
    sortOrder: 0,
    isHighlighted: false,
  });

  // Fetch all subscription features
  const { data: features = [], isLoading } = useQuery<SubscriptionFeature[]>({
    queryKey: ["/api/admin/subscription-features"],
  });

  // Create feature mutation
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
      
      // Assign to tier
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
      setNewFeature({
        slug: "",
        name: "",
        description: "",
        tier: "basic",
        sortOrder: 0,
        isHighlighted: false,
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create feature", variant: "destructive" });
    },
  });

  // Update feature mutation
  const updateFeatureMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SubscriptionFeature> }) => {
      const response = await fetch(`/api/admin/subscription-features/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update feature");
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

  // Delete feature mutation
  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/subscription-features/${id}`, {
        method: "DELETE",
      });
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

  // Filter features by tier
  const filteredFeatures = selectedTier === "all" 
    ? features 
    : features.filter(f => f.tiers.some(t => t.tier === selectedTier));

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

      {/* Tier Filter */}
      <div className="flex gap-2">
        <Button
          variant={selectedTier === "all" ? "default" : "outline"}
          onClick={() => setSelectedTier("all")}
          data-testid="button-filter-all"
        >
          All Tiers
        </Button>
        <Button
          variant={selectedTier === "basic" ? "default" : "outline"}
          onClick={() => setSelectedTier("basic")}
          data-testid="button-filter-basic"
        >
          Basic
        </Button>
        <Button
          variant={selectedTier === "pro" ? "default" : "outline"}
          onClick={() => setSelectedTier("pro")}
          data-testid="button-filter-pro"
        >
          Pro
        </Button>
        <Button
          variant={selectedTier === "premier" ? "default" : "outline"}
          onClick={() => setSelectedTier("premier")}
          data-testid="button-filter-premier"
        >
          Premier
        </Button>
      </div>

      {/* Features List */}
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
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingFeature(feature)}
                      data-testid={`button-edit-${feature.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFeatureMutation.mutate(feature.id)}
                      data-testid={`button-delete-${feature.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
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
                disabled={!newFeature.slug || !newFeature.name}
                data-testid="button-save-feature"
              >
                Create Feature
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
