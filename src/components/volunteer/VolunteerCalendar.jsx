import { useState, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, MapPin, Users } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import VolunteerApplicationModal from "./VolunteerApplicationModal";

export default function VolunteerCalendar({ opportunities }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group opportunities by start date
  const opportunitiesByDate = useMemo(() => {
    const grouped = {};
    opportunities.forEach((opp) => {
      const date = opp.start_date;
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(opp);
    });
    return grouped;
  }, [opportunities]);

  const selectedDayOpportunities = selectedDay ? opportunitiesByDate[format(selectedDay, "yyyy-MM-dd")] || [] : [];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekStart = startOfMonth(currentDate);
  const firstDayOfWeek = weekStart.getDay();

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-amber-600" />
            Volunteer Opportunities Calendar
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-slate-700">{format(currentDate, "MMMM yyyy")}</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map((day) => (
              <div key={day} className="text-center font-semibold text-slate-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Days of month */}
            {daysInMonth.map((day) => {
              const dayStr = format(day, "yyyy-MM-dd");
              const dayOpportunities = opportunitiesByDate[dayStr] || [];
              const isSelected = selectedDay && isSameDay(day, selectedDay);

              return (
                <button
                  key={dayStr}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square p-2 rounded-lg border-2 transition-all text-left flex flex-col ${
                    isSelected
                      ? "border-amber-400 bg-amber-50"
                      : dayOpportunities.length > 0
                      ? "border-amber-200 bg-amber-50 hover:border-amber-400"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-sm font-semibold text-slate-900">{format(day, "d")}</span>
                  {dayOpportunities.length > 0 && (
                    <span className="text-xs font-medium text-amber-600 mt-1">
                      {dayOpportunities.length} event{dayOpportunities.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="lg:col-span-1 border-l border-slate-200 pl-6">
          {selectedDay ? (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                {format(selectedDay, "EEE, MMM d, yyyy")}
              </h3>

              {selectedDayOpportunities.length === 0 ? (
                <p className="text-slate-500 text-sm">No opportunities scheduled for this date.</p>
              ) : (
                <div className="space-y-3">
                  {selectedDayOpportunities.map((opp) => (
                    <div key={opp.id} className="p-3 border border-slate-200 rounded-lg hover:border-amber-300 transition-colors">
                      <h4 className="font-semibold text-slate-900 text-sm mb-2">{opp.title}</h4>
                      <div className="space-y-1 mb-3">
                        {opp.location && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <MapPin className="w-3 h-3" />
                            {opp.location}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Users className="w-3 h-3" />
                          {opp.spots_available} spot{opp.spots_available !== 1 ? "s" : ""} available
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full bg-amber-600 hover:bg-amber-700"
                        onClick={() => setSelectedOpportunity(opp)}
                      >
                        Apply Now
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Select a date to view opportunities</p>
          )}
        </div>
      </div>

      {/* Application Modal */}
      {selectedOpportunity && (
        <VolunteerApplicationModal
          opportunity={selectedOpportunity}
          isOpen={!!selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
        />
      )}
    </div>
  );
}