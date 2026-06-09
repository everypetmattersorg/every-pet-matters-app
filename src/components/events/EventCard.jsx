import { useState } from "react";
import { format } from "date-fns";
import { Calendar, MapPin, Users, Heart, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function EventCard({ event, onSelectEvent, rsvpStatus, onRSVP, hasReminder, onToggleReminder, loading }) {
  const eventDate = new Date(event.event_date);
  const isUpcoming = eventDate > new Date();

  const eventTypeColors = {
    adoption_event: "bg-rose-100 text-rose-800",
    volunteer_day: "bg-blue-100 text-blue-800",
    fundraiser: "bg-amber-100 text-amber-800",
    education: "bg-green-100 text-green-800",
    other: "bg-slate-100 text-slate-800"
  };

  const eventTypeLabel = {
    adoption_event: "🐾 Adoption Event",
    volunteer_day: "🤝 Volunteer Day",
    fundraiser: "💰 Fundraiser",
    education: "📚 Education",
    other: "📅 Event"
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Header */}
      <div className={`${eventTypeColors[event.event_type] || eventTypeColors.other} px-4 py-3`}>
        <Badge className={eventTypeColors[event.event_type] || eventTypeColors.other}>
          {eventTypeLabel[event.event_type]}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-slate-800 mb-3 text-lg line-clamp-2">{event.title}</h3>

        <div className="space-y-2 mb-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 flex-shrink-0 text-slate-400" />
            <span>{format(eventDate, "MMM d, yyyy")}</span>
            {event.event_time && (
              <span className="text-slate-500">at {event.event_time}</span>
            )}
          </div>

          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">{event.description}</p>
        )}

        {!isUpcoming && (
          <div className="mb-3 text-xs text-slate-500 font-medium">
            Event has passed
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-slate-200 px-4 py-3 space-y-2">
        <Button
          onClick={() => onSelectEvent(event)}
          variant="outline"
          className="w-full rounded-lg text-sm"
        >
          View Details
        </Button>

        {isUpcoming && (
          <div className="flex gap-2">
            <Button
              onClick={() => onRSVP(rsvpStatus === "attending" ? "interested" : "attending")}
              disabled={loading}
              className={`flex-1 rounded-lg text-sm ${
                rsvpStatus === "attending"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-800"
              }`}
            >
              <Heart className={`w-4 h-4 mr-1 ${rsvpStatus === "attending" ? "fill-current" : ""}`} />
              {rsvpStatus === "attending" ? "Going" : "Interested"}
            </Button>

            <Button
              onClick={onToggleReminder}
              disabled={loading}
              variant="outline"
              size="icon"
              className="rounded-lg"
              title={hasReminder ? "Remove reminder" : "Set reminder"}
            >
              <Bell className={`w-4 h-4 ${hasReminder ? "fill-blue-600 text-blue-600" : "text-slate-400"}`} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}