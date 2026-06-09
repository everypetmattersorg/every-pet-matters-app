import { Input } from "@/components/ui/input";
import { Calendar, Clock } from "lucide-react";

export default function DateTimeStep({ formData, onUpdate }) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Date & Time</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Event Date *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
            <Input
              type="date"
              value={formData.event_date}
              onChange={(e) => onUpdate("event_date", e.target.value)}
              min={minDate}
              className="pl-10 py-2"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">When is your event?</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Start Time *
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
            <Input
              type="time"
              value={formData.event_time}
              onChange={(e) => onUpdate("event_time", e.target.value)}
              className="pl-10 py-2"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">What time does it start?</p>
        </div>
      </div>

      {formData.event_date && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-sm text-emerald-800 font-medium">✓ Event Scheduled</p>
          <p className="text-xs text-emerald-700 mt-1">
            {new Date(formData.event_date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            {formData.event_time && ` at ${formData.event_time}`}
          </p>
        </div>
      )}
    </div>
  );
}