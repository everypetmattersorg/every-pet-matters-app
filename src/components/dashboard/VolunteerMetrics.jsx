import { Users, Mail, Zap } from "lucide-react";

export default function VolunteerMetrics({ volunteers }) {
  const months = {};
  
  volunteers.forEach(v => {
    const date = new Date(v.created_date);
    const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
    months[monthKey] = (months[monthKey] || 0) + 1;
  });

  const topMonth = Object.entries(months).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-6">Volunteer Engagement</h2>
      
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-600">Total Inquiries</p>
            <p className="text-2xl font-bold text-slate-900">{volunteers.length}</p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <Zap className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-600">Peak Month</p>
            <p className="text-2xl font-bold text-slate-900">
              {topMonth ? topMonth[1] : 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {topMonth ? topMonth[0] : "No data"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-100 rounded-lg">
            <Mail className="w-6 h-6 text-rose-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-600">Recent (30 days)</p>
            <p className="text-2xl font-bold text-slate-900">
              {volunteers.filter(v => {
                const date = new Date(v.created_date);
                const now = new Date();
                return (now - date) / (1000 * 60 * 60 * 24) <= 30;
              }).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}