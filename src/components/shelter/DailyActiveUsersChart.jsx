import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';

async function fetchEvents() {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const { data, error } = await supabase
    .from('analytics_events')
    .select('event_type, created_at')
    .gte('created_at', since.toISOString());
  if (error) throw error;
  return data ?? [];
}

export default function DailyActiveUsersChart() {
  const { data: events = [], isLoading } = useQuery({ queryKey: ['analytics-events'], queryFn: fetchEvents });

  const chartData = useMemo(() => {
    const byDay = {};
    for (const e of events) {
      const day = e.created_at.slice(0, 10);
      if (!byDay[day]) byDay[day] = { date: day, sessions: 0, logins: 0 };
      if (e.event_type === 'session') byDay[day].sessions += 1;
      if (e.event_type === 'login') byDay[day].logins += 1;
    }
    return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
  }, [events]);

  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm font-semibold mb-1">Daily Active Users (last 30 days)</p>
        <p className="text-xs text-muted-foreground mb-4">Sessions = unique browser visits per day · Logins = sign-in events</p>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : chartData.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No session data yet — events will appear here as users log in.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 40 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend verticalAlign="top" height={30} />
              <Bar dataKey="sessions" name="Sessions" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="logins" name="Logins" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
