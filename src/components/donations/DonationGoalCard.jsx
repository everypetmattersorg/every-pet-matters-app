import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DonationGoalCard({ goal }) {
  const progressPercent = (goal.current_amount / goal.target_amount) * 100;
  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image */}
      {goal.image_url && (
        <div className="h-40 bg-gradient-to-br from-rose-100 to-pink-100 overflow-hidden">
          <img src={goal.image_url} alt={goal.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{goal.title}</h3>

        {goal.description && (
          <p className="text-slate-600 text-sm mb-4 line-clamp-2">{goal.description}</p>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-medium text-slate-900">
                ${goal.current_amount?.toLocaleString() || 0} / ${goal.target_amount?.toLocaleString() || 0}
              </span>
            </div>
            <span className="text-sm font-semibold text-rose-600">{Math.min(100, Math.round(progressPercent))}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-rose-400 to-pink-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        </div>

        {/* Deadline */}
        {goal.deadline && (
          <div className="flex items-center gap-2 mb-4 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>{daysLeft > 0 ? `${daysLeft} days left` : "Deadline passed"}</span>
          </div>
        )}

        {/* Donate Button */}
        <Link to={createPageUrl("Donate")}>
          <Button className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 gap-2">
            <Heart className="w-4 h-4" />
            Donate Now
          </Button>
        </Link>
      </div>
    </div>
  );
}