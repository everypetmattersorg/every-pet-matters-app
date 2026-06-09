import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Plus, X } from "lucide-react";

export default function PostOpportunityForm({ rescueEmail, rescueName, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "animal_care",
    location: "",
    time_commitment: "flexible",
    start_date: "",
    end_date: "",
    skills_required: [],
    spots_available: 1,
    contact_email: "",
    contact_phone: "",
  });
  const [error, setError] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      if (!data.title || !data.description || !data.location || !data.start_date) {
        throw new Error("Title, description, location, and start date are required");
      }
      return base44.entities.VolunteerOpportunity.create({
        ...data,
        rescue_email: rescueEmail,
        rescue_name: rescueName,
        contact_email: data.contact_email || rescueEmail,
        status: "open",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-opportunities"] });
      onSuccess?.();
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

  const addSkill = () => {
    if (skillInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        skills_required: [...prev.skills_required, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (index) => {
    setFormData((prev) => ({
      ...prev,
      skills_required: prev.skills_required.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Position Title *
        </label>
        <Input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Dog Walker, Event Coordinator"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Description *
        </label>
        <Textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the role, responsibilities, and what volunteers will do..."
          className="h-24"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            required
          >
            <option value="animal_care">Animal Care</option>
            <option value="event_planning">Event Planning</option>
            <option value="fundraising">Fundraising</option>
            <option value="social_media">Social Media</option>
            <option value="administrative">Administrative</option>
            <option value="transportation">Transportation</option>
            <option value="foster_care">Foster Care</option>
            <option value="training">Training</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Time Commitment *
          </label>
          <select
            name="time_commitment"
            value={formData.time_commitment}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            required
          >
            <option value="flexible">Flexible</option>
            <option value="part_time">Part Time</option>
            <option value="full_time">Full Time</option>
            <option value="one_time_event">One-Time Event</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Location *
        </label>
        <Input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="e.g., San Francisco, CA or On-site"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Start Date *
          </label>
          <Input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            End Date (Optional)
          </label>
          <Input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Spots Available
          </label>
          <Input
            type="number"
            name="spots_available"
            value={formData.spots_available}
            onChange={handleChange}
            min="1"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Contact Phone
          </label>
          <Input
            type="tel"
            name="contact_phone"
            value={formData.contact_phone}
            onChange={handleChange}
            placeholder="(123) 456-7890"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Contact Email
        </label>
        <Input
          type="email"
          name="contact_email"
          value={formData.contact_email}
          onChange={handleChange}
          placeholder="Leave empty to use rescue email"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Skills/Experience (Optional)
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
            placeholder="e.g., Dog handling experience"
          />
          <Button
            type="button"
            onClick={addSkill}
            size="icon"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {formData.skills_required.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.skills_required.map((skill, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
          {submitMutation.isPending ? "Publishing..." : "Publish Opportunity"}
        </Button>
      </div>
    </form>
  );
}