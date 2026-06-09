import { Star, User } from "lucide-react";
import { format } from "date-fns";

export default function RescueReviewCard({ review }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-slate-100 rounded-lg">
            <User className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-slate-800">{review.reviewer_name}</div>
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <span className="px-2 py-0.5 bg-slate-100 rounded text-xs capitalize">
                {review.experience_type}
              </span>
              {review.created_date && (
                <span>{format(new Date(review.created_date), "MMM d, yyyy")}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < review.rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300"
              }`}
            />
          ))}
        </div>
      </div>

      {review.title && (
        <h4 className="font-semibold text-slate-800 mb-2">{review.title}</h4>
      )}

      {review.comment && (
        <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}