import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, AlertCircle } from "lucide-react";

export default function VolunteerApplicationModal({ opportunity, onClose }) {
  const [formData, setFormData] = useState({
    volunteer_name: "",
    volunteer_email: "",
    volunteer_phone: "",
    availability: "",
    cover_letter: "",
  });
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser) {
          setFormData((prev) => ({
            ...prev,
            volunteer_name: currentUser.full_name || "",
            volunteer_email: currentUser.email,
          }));
        }
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      if (!data.volunteer_name || !data.volunteer_email) {
        throw new Error("Name and email are required");
      }
      return base44.entities.VolunteerApplication.create({
        opportunity_id: opportunity.id,
        volunteer_email: data.volunteer_email,
        volunteer_name: data.volunteer_name,
        volunteer_phone: data.volunteer_phone || "",
        rescue_email: opportunity.rescue_email,
        opportunity_title: opportunity.title,
        cover_letter: data.cover_letter,
        availability: data.availability,
        status: "pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-applications"] });
      alert("Application submitted successfully! The rescue will review your application soon.");
      onClose();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Apply to Volunteer</h2>
            <p className="text-sm text-slate-600 mt-1">{opportunity.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Full Name *
            </label>
            <Input
              type="text"
              name="volunteer_name"
              value={formData.volunteer_name}
              onChange={handleChange}
              placeholder="Your full name"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Email *
            </label>
            <Input
              type="email"
              name="volunteer_email"
              value={formData.volunteer_email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Phone Number
            </label>
            <Input
              type="tel"
              name="volunteer_phone"
              value={formData.volunteer_phone}
              onChange={handleChange}
              placeholder="(123) 456-7890"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Availability
            </label>
            <Input
              type="text"
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              placeholder="e.g., Weekdays after 5pm, Weekends"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Why do you want to volunteer?
            </label>
            <Textarea
              name="cover_letter"
              value={formData.cover_letter}
              onChange={handleChange}
              placeholder="Tell us about your interest in this opportunity and any relevant experience..."
              className="h-24"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-amber-600 hover:bg-amber-700"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}