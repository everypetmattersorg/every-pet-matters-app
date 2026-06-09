import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Clock, CheckCircle2, Zap, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function VolunteerActivitySection({ userEmail }) {
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["volunteer-activity", userEmail],
    queryFn: () =>
      base44.entities.VolunteerApplication.filter(
        { volunteer_email: userEmail },
        "-created_date"
      ),
  });

  const stats = {
    total: applications.length,
    completed: applications.filter((a) => a.status === "completed").length,
    approved: applications.filter((a) => a.status === "approved").length,
    pending: applications.filter((a) => a.status === "pending").length,
    totalHours: applications.reduce((sum, a) => sum + (a.hours_completed || 0), 0),
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "approved":
        return <Zap className="w-5 h-5 text-blue-600" />;
      case "pending":
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case "rejected":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "approved":
        return <Badge className="bg-blue-100 text-blue-700">Approved</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      case "withdrawn":
        return <Badge className="bg-slate-100 text-slate-700">Withdrawn</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-slate-600 font-medium">Total</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-xs text-slate-600 font-medium">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-slate-600 font-medium">Approved</p>
          <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
        </div>
        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs text-slate-600 font-medium">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-xs text-slate-600 font-medium">Total Hours</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalHours}</p>
        </div>
      </div>

      {/* Activities List */}
      {applications.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No volunteer applications yet</p>
          <p className="text-slate-400 text-sm">Start exploring volunteer opportunities to make a difference!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900">Your Applications</h3>
          {applications.map((app) => (
            <div
              key={app.id}
              className="p-4 border border-slate-200 rounded-lg hover:border-rose-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(app.status)}
                    <h4 className="font-semibold text-slate-900">{app.opportunity_title}</h4>
                  </div>
                  <div className="space-y-1 mb-3">
                    <p className="text-sm text-slate-600">{app.rescue_email}</p>
                    {app.location && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        {app.location}
                      </div>
                    )}
                    {app.hours_completed > 0 && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {app.hours_completed} hours
                        {app.date_completed && ` • ${format(new Date(app.date_completed), "MMM d, yyyy")}`}
                      </div>
                    )}
                  </div>
                  {app.notes && (
                    <p className="text-xs text-slate-600 italic">"{app.notes}"</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(app.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}