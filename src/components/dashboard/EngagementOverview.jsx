import { Eye, Heart, Users, Star } from "lucide-react";

export default function EngagementOverview({ pets, events, volunteers, reviews }) {
  const metrics = [
    {
      icon: Heart,
      label: "Pets Listed",
      value: pets.length,
      color: "rose",
    },
    {
      icon: Users,
      label: "Events Created",
      value: events.length,
      color: "blue",
    },
    {
      icon: Users,
      label: "Volunteer Inquiries",
      value: volunteers.length,
      color: "purple",
    },
    {
      icon: Star,
      label: "Reviews",
      value: reviews.length,
      color: "amber",
    },
  ];

  const colorMap = {
    rose: "bg-rose-100 text-rose-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-6">Engagement Overview</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div key={idx} className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${colorMap[metric.color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-600">{metric.label}</p>
                <p className="text-xl font-bold text-slate-900">{metric.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100">
        <p className="text-sm text-slate-600">
          {pets.length > 0 && (
            <>
              You've listed <span className="font-semibold text-slate-900">{pets.length}</span> pets for adoption.
              {events.length > 0 && ` Created ${events.length} events with ${volunteers.length} volunteer inquiries.`}
            </>
          )}
        </p>
      </div>
    </div>
  );
}