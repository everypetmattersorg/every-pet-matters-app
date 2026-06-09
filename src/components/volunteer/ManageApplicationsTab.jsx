import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

export default function ManageApplicationsTab({ rescueEmail }) {
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["volunteer-applications", rescueEmail],
    queryFn: () => base44.entities.VolunteerApplication.filter({ rescue_email: rescueEmail }, "-created_date", 100),
  });

  const [expandedId, setExpandedId] = useState(null);
  const [responseMessages, setResponseMessages] = useState({});
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, message }) => {
      return base44.entities.VolunteerApplication.update(id, {
        status,
        response_message: message,
        responded_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-applications", rescueEmail] });
      setResponseMessages({});
    },
  });

  const handleApprove = (id) => {
    updateMutation.mutate({
      id,
      status: "approved",
      message: responseMessages[id] || "Your application has been approved!",
    });
  };

  const handleReject = (id) => {
    updateMutation.mutate({
      id,
      status: "rejected",
      message: responseMessages[id] || "We appreciate your interest, but we've selected other candidates.",
    });
  };

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-amber-600 bg-amber-50",
      label: "Pending",
    },
    approved: {
      icon: CheckCircle,
      color: "text-green-600 bg-green-50",
      label: "Approved",
    },
    rejected: {
      icon: XCircle,
      color: "text-red-600 bg-red-50",
      label: "Rejected",
    },
    withdrawn: {
      icon: AlertCircle,
      color: "text-slate-600 bg-slate-50",
      label: "Withdrawn",
    },
  };

  if (isLoading) {
    return <div className="text-center py-8 text-slate-600">Loading applications...</div>;
  }

  const pendingApplications = applications.filter((a) => a.status === "pending");
  const otherApplications = applications.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-6">
      {applications.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">No applications yet.</p>
        </div>
      ) : (
        <>
          {pendingApplications.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-900">
                Pending ({pendingApplications.length})
              </h3>
              {pendingApplications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  isExpanded={expandedId === app.id}
                  onExpand={() => setExpandedId(expandedId === app.id ? null : app.id)}
                  onApprove={() => handleApprove(app.id)}
                  onReject={() => handleReject(app.id)}
                  responseMessage={responseMessages[app.id] || ""}
                  onMessageChange={(msg) =>
                    setResponseMessages({ ...responseMessages, [app.id]: msg })
                  }
                  isLoading={updateMutation.isPending}
                  statusConfig={statusConfig}
                />
              ))}
            </div>
          )}

          {otherApplications.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-900">
                Reviewed ({otherApplications.length})
              </h3>
              {otherApplications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  isExpanded={expandedId === app.id}
                  onExpand={() => setExpandedId(expandedId === app.id ? null : app.id)}
                  statusConfig={statusConfig}
                  readOnly
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ApplicationCard({
  app,
  isExpanded,
  onExpand,
  onApprove,
  onReject,
  responseMessage,
  onMessageChange,
  isLoading,
  statusConfig,
  readOnly,
}) {
  const config = statusConfig[app.status];
  const IconComponent = config.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={onExpand}
        className="w-full p-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-semibold text-slate-900">{app.volunteer_name}</h4>
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <IconComponent className="w-3 h-3" />
                {config.label}
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">{app.opportunity_title}</p>
            <p className="text-xs text-slate-500">{app.volunteer_email}</p>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-200 p-4 space-y-4 bg-slate-50">
          {app.volunteer_phone && (
            <div>
              <p className="text-xs text-slate-600">Phone</p>
              <p className="text-sm text-slate-900">{app.volunteer_phone}</p>
            </div>
          )}

          {app.availability && (
            <div>
              <p className="text-xs text-slate-600">Availability</p>
              <p className="text-sm text-slate-900">{app.availability}</p>
            </div>
          )}

          {app.cover_letter && (
            <div>
              <p className="text-xs text-slate-600 mb-1">Application Message</p>
              <p className="text-sm text-slate-900 bg-white p-3 rounded-lg border border-slate-200">
                {app.cover_letter}
              </p>
            </div>
          )}

          {app.response_message && (
            <div>
              <p className="text-xs text-slate-600 mb-1">Your Response</p>
              <p className="text-sm text-slate-900 bg-white p-3 rounded-lg border border-slate-200">
                {app.response_message}
              </p>
            </div>
          )}

          {!readOnly && app.status === "pending" && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <Textarea
                placeholder="Optional: Add a message for the volunteer..."
                value={responseMessage}
                onChange={(e) => onMessageChange(e.target.value)}
                className="h-20 text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => onReject()}
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  Reject
                </Button>
                <Button
                  onClick={() => onApprove()}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? "Processing..." : "Approve"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}