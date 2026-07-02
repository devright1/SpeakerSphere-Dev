import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

function RequestCard({ request, disciplineName }: { request: TopicRequestItem; disciplineName?: string }) {
  const { toast } = useToast();
  const [adminNotes, setAdminNotes] = useState("");

  const approveMutation = useMutation({
    mutationFn: () => adminRequest("POST", `/api/admin/topic-requests/${request.id}/approve`, { adminNotes: adminNotes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/topic-requests"] });
      toast({ title: "Topic request approved", description: `"${request.topicName}" was added and assigned to ${request.speakerName}.` });
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
          <div className="space-y-2 pt-2 border-t">
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
        <>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">New Requests ({pending.length})</h3>
            {pending.length > 0 ? (
              pending.map((r) => (
                <RequestCard key={r.id} request={r} disciplineName={disciplineName(r.disciplineId)} />
              ))
            ) : (
              <p className="text-sm text-gray-500">No new requests.</p>
            )}
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Approved ({approved.length})</h3>
            {approved.length > 0 ? (
              approved.map((r) => (
                <RequestCard key={r.id} request={r} disciplineName={disciplineName(r.disciplineId)} />
              ))
            ) : (
              <p className="text-sm text-gray-500">No approved requests yet.</p>
            )}
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Declined ({rejected.length})</h3>
            {rejected.length > 0 ? (
              rejected.map((r) => (
                <RequestCard key={r.id} request={r} disciplineName={disciplineName(r.disciplineId)} />
              ))
            ) : (
              <p className="text-sm text-gray-500">No declined requests.</p>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500">No topic requests yet.</p>
      )}
    </div>
  );
}
