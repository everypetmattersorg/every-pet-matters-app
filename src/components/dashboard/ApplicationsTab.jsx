import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Check, X, Eye } from "lucide-react";
import ApplicationDetailModal from "./ApplicationDetailModal";

export default function ApplicationsTab({ rescueEmail }) {
  const [selectedApp, setSelectedApp] = useState(null);
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications", rescueEmail],
    queryFn: async () => {
      const apps = await base44.entities.AdoptionApplication.filter({
        rescue_email: rescueEmail
      }, "-created_date", 100);
      return apps;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (appData) =>
      base44.entities.AdoptionApplication.update(appData.id, {
        status: appData.status,
        notes: appData.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", rescueEmail] });
    },
  });

  const handleApprove = (app) => {
    updateMutation.mutate({
      id: app.id,
      status: "approved",
      notes: app.notes,
    });
  };

  const handleReject = (app) => {
    updateMutation.mutate({
      id: app.id,
      status: "rejected",
      notes: app.notes,
    });
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    withdrawn: "bg-gray-100 text-gray-800",
  };

  if (isLoading) {
    return <div className="text-center py-8 text-slate-500">Loading applications...</div>;
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500">No adoption applications yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Pet</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Applicant</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-700">Applied</th>
              <th className="text-right py-3 px-4 font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 font-medium text-slate-900">{app.pet_name}</td>
                <td className="py-3 px-4 text-slate-700">{app.applicant_name}</td>
                <td className="py-3 px-4 text-slate-600 text-xs">{app.applicant_email}</td>
                <td className="py-3 px-4">
                  <Badge className={statusColors[app.status]}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </Badge>
                </td>
                <td className="py-3 px-4 text-slate-600 text-sm">
                  {new Date(app.created_date).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedApp(app)}
                      className="rounded-lg gap-1"
                    >
                      <Eye className="w-3 h-3" /> View
                    </Button>
                    {app.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(app)}
                          disabled={updateMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 rounded-lg gap-1"
                        >
                          <Check className="w-3 h-3" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(app)}
                          disabled={updateMutation.isPending}
                          className="rounded-lg gap-1"
                        >
                          <X className="w-3 h-3" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onApprove={() => {
            handleApprove(selectedApp);
            setSelectedApp(null);
          }}
          onReject={() => {
            handleReject(selectedApp);
            setSelectedApp(null);
          }}
        />
      )}
    </div>
  );
}