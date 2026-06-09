import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function IntakeTransferChart({ pets = [] }) {
  const data = useMemo(() => {
    const byMonth = {};
    for (const pet of pets) {
      const date = pet.created_date ? new Date(pet.created_date) : null;
      if (!date) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { month: key, intake: 0, transfer: 0 };
      byMonth[key].intake += 1;
      if (pet.transfer_needed) byMonth[key].transfer += 1;
    }
    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
  }, [pets]);

  if (data.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm font-semibold mb-4">Monthly Intake vs Transfer Needed (Last 12 Months)</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Legend verticalAlign="top" height={36} />
            <Bar dataKey="intake" fill="#6366f1" radius={[4, 4, 0, 0]} name="Intake" />
            <Bar dataKey="transfer" fill="#f97316" radius={[4, 4, 0, 0]} name="Transfer Needed" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}