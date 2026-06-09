import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ResourceApprovalPanel() {
  const [expandedId, setExpandedId] = useState(null);
  const [denyingId, setDenyingId] = useState(null);
  const [denyalReason, setDenyalReason] = useState("");
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["pending_resources"],
    queryFn: () => base44.entities.Resource.filter({ status: "pending" }, "-created_date", 100),
  });

  const pendingResources = resources.filter((r) => r.status === "pending");

  const handleApprove = async (resourceId) => {
    await base44.entities.Resource.update(resourceId, {
      status: "approved",
      approved_by_email: user?.email,
      approved_at: new Date().toISOString(),
    });
    queryClient.invalidateQueries({ queryKey: ["pending_resources"] });
    queryClient.invalidateQueries({ queryKey: ["resources"] });
  };

  const handleDeny = async (resourceId) => {
    if (!denyalReason.trim()) {
      alert("Please provide a reason for denial");
      return;
    }
    await base44.entities.Resource.update(resourceId, {
      status: "denied",
      denial_reason: denyalReason,
      approved_by_email: user?.email,
      approved_at: new Date().toISOString(),
    });
    queryClient.invalidateQueries({ queryKey: ["pending_resources"] });
    queryClient.invalidateQueries({ queryKey: ["resources"] });
    setDenyingId(null);
    setDenyalReason("");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">
          pending resource approvals
        </h3>
        <Badge className="bg-amber-100 text-amber-700">{pendingResources.length}</Badge>
      </div>

      {pendingResources.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          no pending resources to review
        </div>
      ) : (
        <div className="space-y-2">
          {pendingResources.map((resource) => (
            <div key={resource.id} className="bg-white rounded-lg border border-slate-200">
              {/* Header */}
              <button
                onClick={() => setExpandedId(expandedId === resource.id ? null : resource.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-800">{resource.title}</span>
                    <Badge className="text-xs bg-slate-100 text-slate-600 capitalize">
                      {resource.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    submitted by {resource.submitted_by_name} ({resource.submitted_by_email})
                  </p>
                </div>
                {expandedId === resource.id ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {/* Expanded Details */}
              {expandedId === resource.id && (
                <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-3">
                  {resource.summary && (
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">summary</p>
                      <p className="text-sm text-slate-700">{resource.summary}</p>
                    </div>
                  )}

                  {resource.content && (
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">content preview</p>
                      <p className="text-sm text-slate-700 line-clamp-3">{resource.content}</p>
                    </div>
                  )}

                  {resource.org_name && (
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">organization</p>
                      <p className="text-sm text-slate-700">{resource.org_name}</p>
                      {resource.org_address && (
                        <p className="text-xs text-slate-600">
                          {resource.org_address}
                          {resource.org_city && `, ${resource.org_city}`}
                          {resource.org_state && ` ${resource.org_state}`}
                        </p>
                      )}
                    </div>
                  )}

                  {resource.group_url && (
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">group link</p>
                      <a
                        href={resource.group_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {resource.group_url}
                      </a>
                    </div>
                  )}

                  {resource.tags?.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">tags</p>
                      <div className="flex flex-wrap gap-1">
                        {resource.tags.map((tag) => (
                          <Badge key={tag} className="bg-blue-100 text-blue-700 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <Button
                      onClick={() => handleApprove(resource.id)}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> approve
                    </Button>
                    <Button
                      onClick={() => setDenyingId(resource.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> deny
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Denial Dialog */}
      <Dialog open={!!denyingId} onOpenChange={() => setDenyingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>deny resource</DialogTitle>
            <DialogDescription>
              provide a reason for denying this resource submission
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={denyalReason}
              onChange={(e) => setDenyalReason(e.target.value)}
              placeholder="explain why this resource is being denied..."
              className="h-24 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDenyingId(null);
                  setDenyalReason("");
                }}
              >
                cancel
              </Button>
              <Button
                onClick={() => handleDeny(denyingId)}
                className="bg-red-600 hover:bg-red-700"
              >
                confirm denial
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}