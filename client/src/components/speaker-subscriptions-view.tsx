import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, DollarSign, Calendar, CreditCard } from "lucide-react";
import type { Speaker } from "@shared/schema";

interface SpeakerSubscription extends Speaker {
  subscriptionInterval?: string;
  subscriptionAmount?: number;
}

export function SpeakerSubscriptionsView() {
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch speaker subscriptions
  const { data: speakerSubscriptions = [], isLoading } = useQuery<SpeakerSubscription[]>({
    queryKey: ["/api/admin/speaker-subscriptions", { tier: tierFilter !== "all" ? tierFilter : undefined, status: statusFilter !== "all" ? statusFilter : undefined }],
  });

  // Filter speakers by search query
  const filteredSpeakers = speakerSubscriptions.filter(speaker => 
    !searchQuery || 
    speaker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    speaker.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate statistics
  const stats = {
    total: speakerSubscriptions.length,
    basic: speakerSubscriptions.filter(s => s.subscriptionTier === "basic").length,
    pro: speakerSubscriptions.filter(s => s.subscriptionTier === "pro").length,
    premier: speakerSubscriptions.filter(s => s.subscriptionTier === "premier").length,
    active: speakerSubscriptions.filter(s => s.subscriptionStatus === "active").length,
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return "-";
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            Subscription details and billing information for all speakers
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSpeakers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No speakers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSpeakers.map((speaker) => (
                    <TableRow key={speaker.id} data-testid={`speaker-row-${speaker.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{speaker.name}</div>
                          <div className="text-sm text-muted-foreground">{speaker.title}</div>
                        </div>
                      </TableCell>
                      <TableCell>
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
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {speaker.subscriptionAmount ? (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>{formatCurrency(speaker.subscriptionAmount)}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{formatDate(speaker.subscriptionPeriodEnd)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
