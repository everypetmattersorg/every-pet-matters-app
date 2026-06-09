import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Check, X, Eye, Filter, ArrowUpDown } from "lucide-react";
import ApplicationDetailModal from "./ApplicationDetailModal";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-gray-100 text-gray-800",
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "pet_name", label: "Pet Name (A-Z)" },
  { value: "applicant_name", label: "Applicant Name (A-Z)" },
];

export default function EnhancedApplicationsTab({ rescueEmail }) {
  const [selectedApp, setSelectedApp] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["applications", rescueEmail],
    queryFn: async () => {
      const apps = await base44.entities.AdoptionApplication.filter(
        { rescue_email: rescueEmail },
        "-created_date",
        200
      );
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

  // Filtering and sorting logic
  const filteredApplications = applications
    .filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          app.pet_name?.toLowerCase().includes(search) ||
          app.applicant_name?.toLowerCase().includes(search) ||
          app.applicant_email?.toLowerCase().includes(search)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.created_date) - new Date(a.created_date);
      if (sortBy === "oldest")
        return new Date(a.created_date) - new Date(b.created_date);
      if (sortBy === "pet_name")
        return (a.pet_name || "").localeCompare(b.pet_name || "");
      if (sortBy === "applicant_name")
        return (a.applicant_name || "").localeCompare(b.applicant_name || "");
      return 0;
    });

  const statusCounts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-8 text-slate-500">
          Loading applications...
        </CardContent>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No adoption applications yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Adoption Applications
          </CardTitle>
          <Badge className="bg-blue-100 text-blue-800">{applications.length} total</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* Status Filter */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-slate-600" />
              <label className="text-sm font-medium text-slate-700">Status</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: `All (${statusCounts.all})` },
                { value: "pending", label: `Pending (${statusCounts.pending})` },
                { value: "approved", label: `Approved (${statusCounts.approved})` },
                { value: "rejected", label: `Rejected (${statusCounts.rejected})` },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === option.value
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort and Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Pet name, applicant, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        {filteredApplications.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No applications matching your filters
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Pet</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">
                    Applicant
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Applied</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900">{app.pet_name}</td>
                    <td className="py-3 px-4 text-slate-700">{app.applicant_name}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs">{app.applicant_email}</td>
                    <td className="py-3 px-4">
                      <Badge className={STATUS_COLORS[app.status]}>
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
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(app)}
                              disabled={updateMutation.isPending}
                              className="rounded-lg gap-1"
                            >
                              <X className="w-3 h-3" />
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
        )}

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
      </CardContent>
    </Card>
  );
}