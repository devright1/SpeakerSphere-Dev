import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, DollarSign, Calendar, Info, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Speaker } from "@shared/schema";

interface SpeakerSubscription extends Speaker {
  subscriptionInterval?: string;
  subscriptionAmount?: number;
}

export function SpeakerSubscriptionsView() {
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Sponsor dialog state
  const [sponsorDialogOpen, setSponsorDialogOpen] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState<SpeakerSubscription | null>(null);
  const [sponsorTier, setSponsorTier] = useState<string>("none");
  const [sponsorNote, setSponsorNote] = useState("");

  const { toast } = useToast();

  const { data: speakerSubscriptions = [], isLoading } = useQuery<SpeakerSubscription[]>({
    queryKey: ["/api/admin/speaker-subscriptions", { tier: tierFilter !== "all" ? tierFilter : undefined, status: statusFilter !== "all" ? statusFilter : undefined }],
  });

  const sponsorMutation = useMutation({
    mutationFn: async ({ speakerId, tier, note }: { speakerId: number; tier: string | null; note: string }) => {
      const adminEmail = localStorage.getItem("adminEmail") || "";
      const res = await fetch(`/api/admin/speakers/${speakerId}/sponsored-tier`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Email": adminEmail,
        },
        body: JSON.stringify({ tier, note: note || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update sponsored tier");
      }
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speaker-subscriptions"] });
      setSponsorDialogOpen(false);
      toast({
        title: vars.tier ? "Sponsored tier granted" : "Sponsorship removed",
        description: vars.tier
          ? `${selectedSpeaker?.name} is now on a sponsored ${vars.tier} plan.`
          : `${selectedSpeaker?.name}'s sponsorship has been removed.`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openSponsorDialog = (speaker: SpeakerSubscription) => {
    setSelectedSpeaker(speaker);
    setSponsorTier((speaker as any).sponsoredTier ?? "none");
    setSponsorNote((speaker as any).sponsoredNote ?? "");
    setSponsorDialogOpen(true);
  };

  const handleSponsorSave = () => {
    if (!selectedSpeaker) return;
    sponsorMutation.mutate({
      speakerId: selectedSpeaker.id,
      tier: sponsorTier === "none" ? null : sponsorTier,
      note: sponsorNote,
    });
  };

  const filteredSpeakers = speakerSubscriptions.filter(speaker =>
    !searchQuery ||
    speaker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    speaker.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: speakerSubscriptions.length,
    basic: speakerSubscriptions.filter(s => s.subscriptionTier === "basic").length,
    pro: speakerSubscriptions.filter(s => s.subscriptionTier === "pro").length,
    premier: speakerSubscriptions.filter(s => s.subscriptionTier === "premier").length,
    active: speakerSubscriptions.filter(s => s.subscriptionStatus === "active").length,
    sponsored: speakerSubscriptions.filter(s => !!(s as any).sponsoredTier).length,
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return "-";
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const formatCancellationReason = (reason: string | null) => {
    if (!reason) return null;
    try {
      const data = JSON.parse(reason);
      const reasons: Record<string, string> = {
        too_expensive: "Too expensive",
        not_using_enough: "Not using enough",
        missing_features: "Missing features",
        found_alternative: "Found alternative",
        technical_issues: "Technical issues",
        other: "Other",
      };
      const recommend: Record<string, string> = { yes: "Yes", no: "No", maybe: "Maybe" };
      return {
        primaryReason: reasons[data.primaryReason] || data.primaryReason,
        wouldRecommend: data.wouldRecommend ? recommend[data.wouldRecommend] : null,
        missingFeatures: data.missingFeatures || null,
        additionalFeedback: data.additionalFeedback || null,
      };
    } catch {
      return { plainText: reason };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Speaker Subscriptions</h2>
        <p className="text-muted-foreground">
          View and manage speaker subscription tiers and billing information
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Speakers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-speakers">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pro Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="stat-pro-speakers">{stats.pro}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Premier Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600" data-testid="stat-premier-speakers">{stats.premier}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-active-subscriptions">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sponsored</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.sponsored}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search speakers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-speakers"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger data-testid="select-tier-filter">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="premier">Premier</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Speakers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Speaker Subscriptions ({filteredSpeakers.length})</CardTitle>
          <CardDescription>
            Subscription details and billing information for all speakers. Use the <strong>Sponsor</strong> button to grant free tier access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading speaker subscriptions...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Speaker</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Period End</TableHead>
                  <TableHead>Cancelled At</TableHead>
                  <TableHead>Cancellation Reason</TableHead>
                  <TableHead>Sponsor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSpeakers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No speakers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSpeakers.map((speaker) => {
                    const sponsored = (speaker as any).sponsoredTier as string | null;
                    const sponsoredNote = (speaker as any).sponsoredNote as string | null;
                    return (
                      <TableRow key={speaker.id} data-testid={`speaker-row-${speaker.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{speaker.name}</div>
                            <div className="text-sm text-muted-foreground">{speaker.title}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={
                                speaker.subscriptionTier === "premier" ? "default" :
                                speaker.subscriptionTier === "pro" ? "secondary" :
                                "outline"
                              }
                              data-testid={`badge-tier-${speaker.id}`}
                            >
                              {speaker.subscriptionTier.charAt(0).toUpperCase() + speaker.subscriptionTier.slice(1)}
                            </Badge>
                            {sponsored && (
                              <Badge className="bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-100 text-xs gap-1">
                                <Gift className="h-3 w-3" />
                                Sponsored {sponsored.charAt(0).toUpperCase() + sponsored.slice(1)}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              speaker.subscriptionStatus === "active" ? "default" :
                              speaker.subscriptionStatus === "past_due" ? "destructive" :
                              "outline"
                            }
                            data-testid={`badge-status-${speaker.id}`}
                          >
                            {speaker.subscriptionStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {speaker.subscriptionInterval ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="capitalize">{speaker.subscriptionInterval}</span>
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {speaker.subscriptionAmount ? (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span>{formatCurrency(speaker.subscriptionAmount)}</span>
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell>{formatDate(speaker.subscriptionPeriodEnd)}</TableCell>
                        <TableCell>
                          {speaker.cancelledAt ? (
                            <div className="text-sm">{formatDate(speaker.cancelledAt)}</div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {speaker.cancellationReason ? (() => {
                            const feedback = formatCancellationReason(speaker.cancellationReason);
                            if (!feedback) return <span className="text-muted-foreground">-</span>;
                            if ("plainText" in feedback) {
                              return (
                                <div className="max-w-xs">
                                  <p className="text-sm truncate" title={feedback.plainText}>{feedback.plainText}</p>
                                </div>
                              );
                            }
                            return (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-auto p-1 hover:bg-muted">
                                    <div className="flex items-center gap-2 text-left">
                                      <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <span className="text-sm">{feedback.primaryReason}</span>
                                    </div>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80" align="start">
                                  <div className="space-y-3">
                                    <div>
                                      <h4 className="font-medium text-sm mb-1">Primary Reason</h4>
                                      <p className="text-sm text-muted-foreground">{feedback.primaryReason}</p>
                                    </div>
                                    {feedback.wouldRecommend && (
                                      <div>
                                        <h4 className="font-medium text-sm mb-1">Would Recommend?</h4>
                                        <p className="text-sm text-muted-foreground">{feedback.wouldRecommend}</p>
                                      </div>
                                    )}
                                    {feedback.missingFeatures && (
                                      <div>
                                        <h4 className="font-medium text-sm mb-1">Missing Features</h4>
                                        <p className="text-sm text-muted-foreground">{feedback.missingFeatures}</p>
                                      </div>
                                    )}
                                    {feedback.additionalFeedback && (
                                      <div>
                                        <h4 className="font-medium text-sm mb-1">Additional Feedback</h4>
                                        <p className="text-sm text-muted-foreground">{feedback.additionalFeedback}</p>
                                      </div>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            );
                          })() : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant={sponsored ? "outline" : "ghost"}
                            size="sm"
                            className={sponsored ? "border-amber-400 text-amber-700 hover:bg-amber-50" : ""}
                            onClick={() => openSponsorDialog(speaker)}
                            title={sponsoredNote || undefined}
                          >
                            <Gift className="h-4 w-4 mr-1" />
                            {sponsored ? "Edit" : "Sponsor"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sponsor Dialog */}
      <Dialog open={sponsorDialogOpen} onOpenChange={setSponsorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-600" />
              Sponsor Subscription
            </DialogTitle>
            <DialogDescription>
              Grant <strong>{selectedSpeaker?.name}</strong> a free subscription tier sponsored by DevRight. This overrides their Stripe tier and takes effect immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Sponsored Tier</Label>
              <Select value={sponsorTier} onValueChange={setSponsorTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (remove sponsorship)</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="premier">Premier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Internal Note <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                placeholder="e.g. Sponsored for speaking at DevRight Summit 2026"
                value={sponsorNote}
                onChange={(e) => setSponsorNote(e.target.value)}
                rows={2}
              />
            </div>
            {sponsorTier === "none" && (selectedSpeaker as any)?.sponsoredTier && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                This will remove the existing sponsorship and return the speaker to their paid tier (or Basic if they have none).
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSponsorDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSponsorSave}
              disabled={sponsorMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {sponsorMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
