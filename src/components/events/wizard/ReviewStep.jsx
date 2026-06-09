import { CheckCircle2, Calendar, MapPin, Clock, Zap } from "lucide-react";

const eventTypeLabels = {
  adoption_event: "🐾 Adoption Event",
  volunteer_day: "👥 Volunteer Day",
  fundraiser: "💰 Fundraiser",
  education: "📚 Education Class",
  other: "📌 Other",
};

export default function ReviewStep({ formData }) {
  const eventDate = new Date(formData.event_date);
  const dateStr = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Review Your Event</h2>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-emerald-800">
          Everything looks good! Click "Create Event" to publish.
        </p>
      </div>

      {/* Event Details Card */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Event Type</p>
          <p className="text-lg font-bold text-slate-900 mt-1">
            {eventTypeLabels[formData.event_type]}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Title</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{formData.title}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Description</p>
          <p className="text-slate-700 mt-1 leading-relaxed">{formData.description}</p>
        </div>

        <hr className="border-slate-300" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-600">Date</p>
              <p className="font-semibold text-slate-900">{dateStr}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Clock className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-600">Time</p>
              <p className="font-semibold text-slate-900">{formData.event_time}</p>
            </div>
          </div>

          <div className="flex gap-3 sm:col-span-2">
            <MapPin className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-slate-600">Location</p>
              <p className="font-semibold text-slate-900">{formData.location}</p>
            </div>
          </div>
        </div>

        <hr className="border-slate-300" />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-600" />
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Promotional Description</p>
          </div>
          <p className="text-slate-700 leading-relaxed italic">
            "{formData.promotional_description}"
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-600 text-center">
        Ready to share this event? Click the button below to make it live!
      </p>
    </div>
  );
}