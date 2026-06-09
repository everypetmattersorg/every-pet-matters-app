import { Calendar, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

export default function EventCard({ event }) {
  const eventTypeColors = {
    adoption_event: "bg-rose-100 text-rose-800",
    volunteer_day: "bg-blue-100 text-blue-800",
    fundraiser: "bg-amber-100 text-amber-800",
    education: "bg-purple-100 text-purple-800",
    other: "bg-slate-100 text-slate-800"
  };

  const eventTypeLabels = {
    adoption_event: "Adoption Event",
    volunteer_day: "Volunteer Day",
    fundraiser: "Fundraiser",
    education: "Education",
    other: "Other"
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:shadow-md transition p-4">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-slate-900 text-sm">{event.title}</h3>
        <Badge className={eventTypeColors[event.event_type]}>
          {eventTypeLabels[event.event_type]}
        </Badge>
      </div>

      {event.description && (
        <p className="text-xs text-slate-600 mb-3 line-clamp-2">{event.description}</p>
      )}

      <div className="space-y-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{format(parseISO(event.event_date), "MMM d, yyyy")}</span>
        </div>
        {event.event_time && (
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{event.event_time}</span>
          </div>
        )}
        {event.location && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        )}
      </div>
    </div>
  );
}