import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function EventAttendanceChart({ events, rsvps }) {
  const data = events.slice(0, 10).map(event => {
    const eventRsvps = rsvps.filter(r => r.event_id === event.id);
    const attending = eventRsvps.filter(r => r.status === "attending").length;
    const interested = eventRsvps.filter(r => r.status === "interested").length;

    return {
      name: event.title.substring(0, 15),
      Attending: attending,
      Interested: interested,
      Total: eventRsvps.length,
    };
  });

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-6">Event Attendance</h2>
      {events.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: "12px" }} />
            <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
              }}
            />
            <Legend />
            <Bar dataKey="Attending" fill="#10b981" />
            <Bar dataKey="Interested" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center text-slate-400">
          No events created yet
        </div>
      )}
    </div>
  );
}