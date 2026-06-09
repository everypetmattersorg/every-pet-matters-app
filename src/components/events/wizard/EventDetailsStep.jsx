import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function EventDetailsStep({ formData, onUpdate }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Event Details</h2>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Event Title *
        </label>
        <Input
          placeholder="e.g., Spring Adoption Fair"
          value={formData.title}
          onChange={(e) => onUpdate("title", e.target.value)}
          className="py-2"
        />
        <p className="text-xs text-slate-500 mt-1">Give your event a clear, catchy name</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Event Type *
        </label>
        <select
          value={formData.event_type}
          onChange={(e) => onUpdate("event_type", e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="adoption_event">Adoption Event</option>
          <option value="volunteer_day">Volunteer Day</option>
          <option value="fundraiser">Fundraiser</option>
          <option value="education">Training or Class</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Description *
        </label>
        <Textarea
          placeholder="Describe what attendees can expect, activities, highlights, etc."
          value={formData.description}
          onChange={(e) => onUpdate("description", e.target.value)}
          className="h-32"
        />
        <p className="text-xs text-slate-500 mt-1">Be detailed to attract more attendees</p>
      </div>
    </div>
  );
}