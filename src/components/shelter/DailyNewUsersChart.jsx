import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

async function fetchNewUsers() {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const { data, error } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', since.toISOString());
  if (error) throw error;
  return data ?? [];
}

export default function DailyNewUsersChart() {
  const { data: profiles = [], isLoading } = useQuery({ queryKey: ['new-users-chart'], queryFn: fetchNewUsers });

  const chartData = useMemo(() => {
    const byDay = {};
    for (const p of profiles) {
      const day = p.created_at.slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    }
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }, [profiles]);

  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm font-semibold mb-1">New Signups (last 30 days)</p>
        <p className="text-xs text-muted-foreground mb-4">Users who created an account in the past 30 days</p>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : chartData.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No new signups in the last 30 days.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 40 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="New Users" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
