import { useState, useEffect } from "react";
import { HERO_COLORS } from "@/lib/heroConfig";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Search, Loader2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import EventCard from "@/components/events/EventCard";
import EventDetail from "@/components/events/EventDetail";
import { Skeleton } from "@/components/ui/skeleton";

const EVENT_TYPES = [
{ value: "adoption_event", label: "🐾 Adoption Events" },
{ value: "volunteer_day", label: "🤝 Volunteer Days" },
{ value: "fundraiser", label: "💰 Fundraisers" },
{ value: "education", label: "📚 Education" },
{ value: "all", label: "All Events" }];


export default function Events() {
  const [user, setUser] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [userRSVPs, setUserRSVPs] = useState({});
  const [userReminders, setUserReminders] = useState({});

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ["events"],
    queryFn: () => base44.entities.RescueEvent.list("-event_date", 100)
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;

    // Load user's RSVPs and reminders
    Promise.all([
    base44.entities.EventRSVP.filter({ user_email: user.email }, null, 50).
    then((rsvps) => {
      const rsvpMap = {};
      rsvps.forEach((r) => {
        rsvpMap[r.event_id] = r.status;
      });
      setUserRSVPs(rsvpMap);
    }).
    catch(() => {}),
    base44.entities.EventReminder.filter({ user_email: user.email }, null, 50).
    then((reminders) => {
      const reminderSet = new Set(reminders.map((r) => r.event_id));
      setUserReminders(reminderSet);
    }).
    catch(() => {})]
    );
  }, [user]);

  const filteredEvents = events.filter((event) => {
    const matchesType = selectedType === "all" || event.event_type === selectedType;
    const matchesLocation = !searchLocation ||
    event.location?.toLowerCase().includes(searchLocation.toLowerCase());
    return matchesType && matchesLocation;
  });

  const upcomingEvents = filteredEvents.filter((e) => new Date(e.event_date) > new Date());
  const pastEvents = filteredEvents.filter((e) => new Date(e.event_date) <= new Date());

  return (
    <div className="min-h-screen" style={{ background: '#FAF5F0' }}>
      {/* Hero */}
      <div className="px-4 py-6" style={{ background: HERO_COLORS.background }}>
        <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden flex flex-col md:flex-row" style={{ minHeight: '300px' }}>
          {/* Left: photo */}
          <div className="md:w-1/2 w-full min-h-48 md:min-h-0 h-full">
            <img src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/b8924888f_newlyedited-101.JPG"
            alt="Pet Events"
            className="w-full h-full object-cover"
            style={{ display: 'block', minHeight: '340px' }} />
          </div>
          {/* Right: panel */}
          <div className="md:w-1/2 w-full flex flex-col justify-center px-10 py-10" style={{ background: HERO_COLORS.panelBg }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-5 self-start" style={{ background: HERO_COLORS.badgeBg, color: HERO_COLORS.badgeText }}>
              <Calendar className="w-4 h-4" /> community events
            </div>
            <h1 className="text-5xl font-black mb-4 leading-tight" style={{ color: HERO_COLORS.panelText }}>events calendar</h1>
            <p className="text-lg max-w-sm leading-relaxed" style={{ color: HERO_COLORS.panelSubtext }}>discover adoption events, training classes, fundraisers, and more in your area.</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 bg-[hsl(var(--background))]">
         {/* Header with Create Button */}
         {user && (user.role === "rescue" || user.role === "shelter" || user.role === "admin") &&
        <div className="mb-8 flex justify-end">
             <Link to={createPageUrl("CreateEvent")}>
               <Button className="hover:bg-blue-700 bg-[#af501d]">
                 <Plus className="w-4 h-4 mr-2" />
                 Add Event
               </Button>
             </Link>
           </div>
        }

         {/* Filters */}
         <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Location Search */}
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1.5 block">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by location..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="pl-10 h-9 text-sm" />
              </div>
            </div>

            {/* Event Type Filter */}
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1.5 block">Event Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-ring">
                {EVENT_TYPES.map((type) =>
                <option key={type.value} value={type.value}>{type.label}</option>
                )}
              </select>
            </div>

            {/* Stats */}
            <div className="h-9 flex items-center">
              <span className="text-sm text-slate-500">showing&nbsp;</span>
              <span className="text-sm font-bold text-slate-800">{filteredEvents.length} events</span>
            </div>
          </div>
        </div>

        {/* Events Loading */}
        {isLoading ?
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) =>
          <Skeleton key={i} className="h-80 rounded-xl" />
          )}
          </div> :
        filteredEvents.length === 0 ?
        <div className="text-center py-16">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">No events found</h3>
            <p className="text-slate-600">
              Try adjusting your filters or check back soon for new events.
            </p>
          </div> :

        <>
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 &&
          <>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Upcoming Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {upcomingEvents.map((event) =>
              <EventCard
                key={event.id}
                event={event}
                onSelectEvent={setSelectedEvent}
                rsvpStatus={userRSVPs[event.id] || "not_attending"}
                onRSVP={(status) => {
                  setUserRSVPs((prev) => ({ ...prev, [event.id]: status }));
                  refetch();
                }}
                hasReminder={userReminders[event.id]}
                onToggleReminder={() => {
                  setUserReminders((prev) => ({
                    ...prev,
                    [event.id]: !prev[event.id]
                  }));
                }} />

              )}
                </div>
              </>
          }

            {/* Past Events */}
            {pastEvents.length > 0 &&
          <>
                <h2 className="text-2xl font-bold text-slate-800 mb-6 opacity-60">Past Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
                  {pastEvents.map((event) =>
              <EventCard
                key={event.id}
                event={event}
                onSelectEvent={setSelectedEvent}
                rsvpStatus={userRSVPs[event.id] || "not_attending"}
                onRSVP={() => {}}
                hasReminder={false}
                onToggleReminder={() => {}}
                loading={false} />

              )}
                </div>
              </>
          }
          </>
        }
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && user &&
      <EventDetail
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        user={user}
        onRSVPUpdated={refetch} />

      }
    </div>);

}