import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const statusConfig = {
  pending: {
    icon: Clock,
    color: "bg-amber-100 text-amber-700",
    label: "pending review",
  },
  approved: {
    icon: Check,
    color: "bg-emerald-100 text-emerald-700",
    label: "approved",
  },
  denied: {
    icon: AlertCircle,
    color: "bg-red-100 text-red-700",
    label: "denied",
  },
};

export default function ResourceStatusView({ userEmail }) {
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["user_resources", userEmail],
    queryFn: () =>
      base44.entities.Resource.filter(
        { submitted_by_email: userEmail },
        "-created_date",
        50
      ),
    enabled: !!userEmail,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        you haven't submitted any resources yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        your resource submissions
      </h3>
      {resources.map((resource) => {
        const config = statusConfig[resource.status] || statusConfig.pending;
        const Icon = config.icon;

        return (
          <div
            key={resource.id}
            className="bg-white rounded-lg border border-slate-200 p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800">{resource.title}</h4>
                <p className="text-sm text-slate-500 mt-0.5">
                  {resource.category === "article" && "📄 article"}
                  {resource.category === "organization" && "🏢 organization"}
                  {resource.category === "social_group" && "💬 social group"}
                </p>
              </div>
              <Badge className={config.color}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
            </div>

            {resource.summary && (
              <p className="text-sm text-slate-600 mb-2">{resource.summary}</p>
            )}

            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>
                submitted{" "}
                {formatDistanceToNow(new Date(resource.created_date), {
                  addSuffix: true,
                })}
              </span>
              {resource.approved_at && (
                <span>
                  {resource.status === "approved" && "✓ approved"}
                  {resource.status === "denied" && "denied"}
                  {" "}
                  {formatDistanceToNow(new Date(resource.approved_at), {
                    addSuffix: true,
                  })}
                </span>
              )}
            </div>

            {resource.status === "denied" && resource.denial_reason && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <p className="font-medium text-xs mb-1">reason for denial:</p>
                <p>{resource.denial_reason}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}