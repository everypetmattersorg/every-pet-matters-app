import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import FosterApplicationCard from "@/components/foster/FosterApplicationCard";
import { Loader2, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const STATUSES = ["all", "pending", "reviewing", "approved", "declined"];

export default function FosterApplicationsTab({ rescueEmail, currentUser }) {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["fosterApplications", rescueEmail],
    queryFn: () => base44.entities.FosterApplication.filter({ rescue_email: rescueEmail }, "-created_date", 200),
    enabled: !!rescueEmail,
  });

  const handleUpdated = (updated) => {
    qc.setQueryData(["fosterApplications", rescueEmail], old =>
      (old || []).map(a => a.id === updated.id ? updated : a)
    );
  };

  const filtered = applications.filter(app => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesSearch = !search || app.applicant_name?.toLowerCase().includes(search.toLowerCase()) ||
      app.applicant_email?.toLowerCase().includes(search.toLowerCase()) ||
      app.pet_name?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = s === "all" ? applications.length : applications.filter(a => a.status === s).length;
    return acc;
  }, {});

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-rose-500" /> Foster Applications
          <span className="text-base font-normal text-slate-500">({applications.length})</span>
        </h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input className="pl-9" placeholder="Search applicants..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${statusFilter === s ? "bg-rose-500 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No applications found.</p>
          <p className="text-slate-400 text-sm mt-1">Applications from potential fosters will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <FosterApplicationCard
              key={app.id}
              application={app}
              currentUser={currentUser}
              isRescue={true}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}