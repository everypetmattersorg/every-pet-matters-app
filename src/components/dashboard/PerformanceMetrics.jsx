import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Heart, CheckCircle2 } from "lucide-react";

export default function PerformanceMetrics({ pets = [], applications = [], events = [], reviews = [] }) {
  const adoptedCount = pets.filter((p) => p.status === "adopted").length;
  const adoptionRate = pets.length > 0 ? ((adoptedCount / pets.length) * 100).toFixed(1) : 0;
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;
  const approvedApplications = applications.filter((a) => a.status === "approved").length;
  const successfulAdoptions = pets.filter((p) => p.status === "adopted").length;

  const metrics = [
    {
      icon: TrendingUp,
      label: "Adoption Rate",
      value: `${adoptionRate}%`,
      subtext: `${adoptedCount} of ${pets.length}`,
      color: "emerald",
    },
    {
      icon: CheckCircle2,
      label: "Successful Adoptions",
      value: successfulAdoptions,
      subtext: "Completed adoptions",
      color: "green",
    },
    {
      icon: Users,
      label: "Approved Applications",
      value: approvedApplications,
      subtext: `${applications.length} total applications`,
      color: "blue",
    },
    {
      icon: Heart,
      label: "Community Rating",
      value: `${averageRating}⭐`,
      subtext: `From ${reviews.length} reviews`,
      color: "amber",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
        const colorClass = {
          emerald: "bg-emerald-50 border-emerald-200",
          green: "bg-green-50 border-green-200",
          blue: "bg-blue-50 border-blue-200",
          amber: "bg-amber-50 border-amber-200",
        }[metric.color];

        const iconColor = {
          emerald: "text-emerald-600",
          green: "text-green-600",
          blue: "text-blue-600",
          amber: "text-amber-600",
        }[metric.color];

        return (
          <Card key={idx} className={`border ${colorClass}`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{metric.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{metric.subtext}</p>
                </div>
                <Icon className={`w-8 h-8 ${iconColor}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}