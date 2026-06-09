import { TrendingUp, TrendingDown } from "lucide-react";

const colorMap = {
  emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  purple: "bg-purple-50 border-purple-200 text-purple-700",
  amber: "bg-amber-50 border-amber-200 text-amber-700",
  rose: "bg-rose-50 border-rose-200 text-rose-700",
};

const dotMap = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

export default function MetricCard({ title, value, subtitle, trend, color = "blue" }) {
  return (
    <div className={`rounded-lg border p-6 ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs opacity-60 mt-2">{subtitle}</p>
          )}
        </div>
        {trend && (
          <div className={`p-2 rounded-lg ${dotMap[color]}`}>
            {trend === "up" ? (
              <TrendingUp className="w-5 h-5 text-white" />
            ) : (
              <TrendingDown className="w-5 h-5 text-white" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}