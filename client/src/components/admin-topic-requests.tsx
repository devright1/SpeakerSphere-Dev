import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Lightbulb } from "lucide-react";

interface TopicRequestItem {
  id: number;
  speakerId: number;
  speakerName: string;
  topicName: string;
  disciplineId: number | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  adminNotes: string | null;
  createdAt: string | null;
  reviewedAt: string | null;
}

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

function RequestCard({
  request,
  disciplineName,
  disciplines,
}: {
  request: TopicRequestItem;
  disciplineName?: string;
  disciplines?: { id: number; name: string }[];
}) {
  const { toast } = useToast();
  const [adminNotes, setAdminNotes] = useState("");
  const [editedTopicName, setEditedTopicName] = useState(request.topicName);
  const [editedDisciplineId, setEditedDisciplineId] = useState<string>(
    request.disciplineId != null ? String(request.disciplineId) : "none"
  );

  const approveMutation = useMutation({
    mutationFn: () =>
      adminRequest("POST", `/api/admin/topic-requests/${request.id}/approve`, {
        adminNotes: adminNotes || undefined,
        topicName: editedTopicName.trim() || undefined,
        disciplineId: editedDisciplineId === "none" ? null : parseInt(editedDisciplineId),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/topic-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/topics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/topics/grouped"] });
      queryClient.invalidateQueries({ queryKey: [`/api/speakers/${request.speakerId}/topics`] });
      toast({ title: "Topic request approved", description: `"${editedTopicName.trim() || request.topicName}" was added and assigned to ${request.speakerName}.` });
    },
    onError: (e: Error) => toast({ title: "Failed to approve request", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => adminRequest("POST", `/api/admin/topic-requests/${request.id}/reject`, { adminNotes: adminNotes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/topic-requests"] });
      toast({ title: "Topic request rejected" });
    },
    onError: (e: Error) => toast({ title: "Failed to reject request", description: e.message, variant: "destructive" }),
  });

  const isPending = request.status === "pending";

  return (
    <Card data-testid={`admin-topic-request-${request.id}`}>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base">{request.topicName}</span>
              <Badge
                variant={request.status === "approved" ? "default" : request.status === "rejected" ? "destructive" : "secondary"}
                data-testid={`badge-status-${request.id}`}
              >
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Requested by {request.speakerName} (Speaker #{request.speakerId})
              {disciplineName && <> · Discipline: {disciplineName}</>}
              {request.createdAt && <> · Submitted {new Date(request.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</>}
            </p>
            {request.notes && <p className="text-sm text-gray-700 mt-2">"{request.notes}"</p>}
            {request.adminNotes && (
              <p className="text-sm text-gray-500 mt-2">Admin notes: {request.adminNotes}</p>
            )}
          </div>
        </div>

        {isPending && (
          <div className="space-y-3 pt-2 border-t">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor={`topic-name-${request.id}`} className="text-xs text-gray-500">
                  Topic name
                </Label>
                <Input
                  id={`topic-name-${request.id}`}
                  value={editedTopicName}
                  onChange={(e) => setEditedTopicName(e.target.value)}
                  data-testid={`input-topic-name-${request.id}`}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`discipline-${request.id}`} className="text-xs text-gray-500">
                  Discipline
                </Label>
                <Select value={editedDisciplineId} onValueChange={setEditedDisciplineId}>
                  <SelectTrigger id={`discipline-${request.id}`} data-testid={`select-discipline-${request.id}`}>
                    <SelectValue placeholder="Select discipline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No discipline</SelectItem>
                    {disciplines?.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Textarea
              placeholder="Optional notes (visible to admin only)"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              data-testid={`input-admin-notes-${request.id}`}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                data-testid={`button-approve-${request.id}`}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => rejectMutation.mutate()}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                data-testid={`button-reject-${request.id}`}
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminTopicRequests() {
  const { data: requests, isLoading } = useQuery<TopicRequestItem[]>({
    queryKey: ["/api/admin/topic-requests"],
    queryFn: () => adminRequest("GET", "/api/admin/topic-requests"),
  });

  const { data: disciplines } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["/api/disciplines"],
  });

  const disciplineName = (id: number | null) =>
    id == null ? undefined : disciplines?.find((d) => d.id === id)?.name;

  const pending = (requests ?? []).filter((r) => r.status === "pending");
  const approved = (requests ?? []).filter((r) => r.status === "approved");
  const rejected = (requests ?? []).filter((r) => r.status === "rejected");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            Topic Requests
          </CardTitle>
          <CardDescription>
            Premier speakers can suggest brand-new speaking topics that aren't in the current list. Review and approve or reject them here.
          </CardDescription>
        </CardHeader>
      </Card>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading requests…</p>
      ) : requests && requests.length > 0 ? (
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="new" data-testid="tab-new-requests">
              New Requests ({pending.length})
            </TabsTrigger>
            <TabsTrigger value="approved" data-testid="tab-approved-requests">
              Approved ({approved.length})
            </TabsTrigger>
            <TabsTrigger value="declined" data-testid="tab-declined-requests">
              Declined ({rejected.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="new" className="space-y-3 mt-4">
            {pending.length > 0 ? (
              pending.map((r) => (
                <RequestCard key={r.id} request={r} disciplineName={disciplineName(r.disciplineId)} disciplines={disciplines} />
              ))
            ) : (
              <p className="text-sm text-gray-500">No new requests.</p>
            )}
          </TabsContent>
          <TabsContent value="approved" className="space-y-3 mt-4">
            {approved.length > 0 ? (
              approved.map((r) => (
                <RequestCard key={r.id} request={r} disciplineName={disciplineName(r.disciplineId)} />
              ))
            ) : (
              <p className="text-sm text-gray-500">No approved requests yet.</p>
            )}
          </TabsContent>
          <TabsContent value="declined" className="space-y-3 mt-4">
            {rejected.length > 0 ? (
              rejected.map((r) => (
                <RequestCard key={r.id} request={r} disciplineName={disciplineName(r.disciplineId)} />
              ))
            ) : (
              <p className="text-sm text-gray-500">No declined requests.</p>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <p className="text-sm text-gray-500">No topic requests yet.</p>
      )}
    </div>
  );
}
