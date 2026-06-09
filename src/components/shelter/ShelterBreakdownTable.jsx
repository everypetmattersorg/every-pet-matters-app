import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function ShelterBreakdownTable({ pets = [] }) {
  const rows = useMemo(() => {
    const map = {};
    for (const pet of pets) {
      const shelter = pet.source || 'Unknown';
      if (!map[shelter]) map[shelter] = { shelter, total: 0, urgent: 0, transfer: 0, adopted: 0 };
      map[shelter].total += 1;
      if (pet.urgent) map[shelter].urgent += 1;
      if (pet.transfer_needed) map[shelter].transfer += 1;
      if (pet.adoption_status === 'adopted') map[shelter].adopted += 1;
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [pets]);

  if (rows.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm font-semibold mb-4">Shelter / Rescue Breakdown</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Shelter / Rescue</th>
                <th className="pb-2 font-medium text-right">Total</th>
                <th className="pb-2 font-medium text-right">Urgent</th>
                <th className="pb-2 font-medium text-right">Transfer</th>
                <th className="pb-2 font-medium text-right">Adopted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.shelter} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="py-2 font-medium">{row.shelter}</td>
                  <td className="py-2 text-right">{row.total}</td>
                  <td className="py-2 text-right text-red-500">{row.urgent || '-'}</td>
                  <td className="py-2 text-right text-orange-500">{row.transfer || '-'}</td>
                  <td className="py-2 text-right text-green-600">{row.adopted || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}