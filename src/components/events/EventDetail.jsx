import { useState } from "react";
import { format } from "date-fns";
import { Calendar, MapPin, Users, Bell, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

export default function EventDetail({ event, onClose, user, onRSVPUpdated }) {
  const [loading, setLoading] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState("interested");
  const [reminderSet, setReminderSet] = useState(false);
  const [guests, setGuests] = useState(1);

  const eventDate = new Date(event.event_date);

  const eventTypeColors = {
    adoption_event: "from-rose-600 to-rose-700",
    volunteer_day: "from-blue-600 to-blue-700",
    fundraiser: "from-amber-600 to-amber-700",
    education: "from-green-600 to-green-700",
    other: "from-slate-600 to-slate-700"
  };

  const handleRSVP = async (status) => {
    try {
      setLoading(true);
      await base44.entities.EventRSVP.create({
        event_id: event.id,
        user_email: user.email,
        status,
        guests
      });
      setRsvpStatus(status);
      onRSVPUpdated?.();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReminder = async () => {
    try {
      setLoading(true);
      if (reminderSet) {
        // In a real app, would delete existing reminder
        setReminderSet(false);
      } else {
        await base44.entities.EventReminder.create({
          event_id: event.id,
          user_email: user.email,
          reminder_type: "day_before"
        });
        setReminderSet(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`bg-gradient-to-r ${eventTypeColors[event.event_type] || eventTypeColors.other} text-white p-6 flex items-start justify-between`}>
          <div className="flex-1">
            <Badge className="mb-3 bg-white/30 text-white border-white">
              {event.event_type.replace(/_/g, " ").toUpperCase()}
            </Badge>
            <h2 className="text-3xl font-bold">{event.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Date & Time */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800">When</h3>
            <div className="flex items-center gap-3 text-slate-600">
              <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <div>
                <div className="font-medium">{format(eventDate, "EEEE, MMMM d, yyyy")}</div>
                {event.event_time && (
                  <div className="text-sm">{event.event_time}</div>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">Where</h3>
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <span>{event.location}</span>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">About</h3>
              <p className="text-slate-600 leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Organizer Info */}
          <div className="space-y-3 bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-800">Hosted by</h3>
            <div>
              <div className="font-medium text-slate-800">{event.rescue_email}</div>
              {event.rescue_email && (
                <a href={`mailto:${event.rescue_email}`} className="text-blue-600 hover:underline text-sm">
                  Contact organizer
                </a>
              )}
            </div>
          </div>

          {/* RSVP Section */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold text-slate-800">Will you attend?</h3>

            <div>
              <label className="text-sm text-slate-600 mb-2 block">Number of guests</label>
              <input
                type="number"
                min="1"
                max="10"
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleRSVP("attending")}
                disabled={loading}
                className="flex-1 bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Yes, I'm Attending
              </Button>

              <Button
                onClick={() => handleRSVP("interested")}
                disabled={loading}
                variant="outline"
                className="flex-1 rounded-lg"
              >
                I'm Interested
              </Button>
            </div>

            <Button
              onClick={handleToggleReminder}
              disabled={loading}
              variant="outline"
              className="w-full rounded-lg"
            >
              <Bell className={`w-4 h-4 mr-2 ${reminderSet ? "fill-blue-600 text-blue-600" : "text-slate-400"}`} />
              {reminderSet ? "Remove Reminder" : "Set Reminder"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}