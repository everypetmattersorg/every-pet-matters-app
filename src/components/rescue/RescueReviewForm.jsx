import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Star } from "lucide-react";

export default function RescueReviewForm({ rescue, onReviewAdded, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    title: "",
    comment: "",
    experience_type: "adoption",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const user = await base44.auth.me();
      
      await base44.entities.RescueReview.create({
        rescue_email: rescue.email,
        reviewer_name: user.full_name,
        reviewer_email: user.email,
        rating: formData.rating,
        title: formData.title,
        comment: formData.comment,
        experience_type: formData.experience_type,
      });

      onReviewAdded?.();
      setFormData({
        rating: 5,
        title: "",
        comment: "",
        experience_type: "adoption",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 rounded-xl p-6 space-y-4">
      <h3 className="font-semibold text-slate-800">Share Your Experience</h3>

      {/* Rating */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`w-6 h-6 ${
                  star <= formData.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Experience Type */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1 block">Experience Type</label>
        <select
          value={formData.experience_type}
          onChange={(e) => setFormData(prev => ({ ...prev, experience_type: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="adoption">Adoption</option>
          <option value="volunteering">Volunteering</option>
          <option value="donation">Donation</option>
          <option value="visit">Visit</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1 block">Review Title</label>
        <Input
          placeholder="e.g., Great experience adopting!"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        />
      </div>

      {/* Comment */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1 block">Your Review</label>
        <Textarea
          placeholder="Tell others about your experience..."
          value={formData.comment}
          onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
          className="h-24"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 justify-end pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.title || !formData.comment}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Submit Review
        </Button>
      </div>
    </form>
  );
}