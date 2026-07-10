import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function AdoptedTransferredMap({ pets = [] }) {
  const stats = useMemo(() => {
    const byState = {};
    for (const pet of pets) {
      const state = pet.rescue_state || (pet.location ? pet.location.split(',').pop().trim() : null);
      if (!state) continue;
      if (!byState[state]) byState[state] = { state, adopted: 0, transferred: 0, total: 0 };
      byState[state].total += 1;
      if (pet.adoption_status === 'adopted') byState[state].adopted += 1;
      if (pet.transfer_needed) byState[state].transferred += 1;
    }
    return Object.values(byState).sort((a, b) => b.total - a.total).slice(0, 15);
  }, [pets]);

  if (stats.length === 0) return null;

  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm font-semibold mb-4">Adopted & Transfer Needed by State (Top 15)</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">State</th>
                <th className="pb-2 font-medium text-right">Total</th>
                <th className="pb-2 font-medium text-right">Adopted</th>
                <th className="pb-2 font-medium text-right">Transfer Needed</th>
                <th className="pb-2 font-medium text-right">Adoption Rate</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(row => (
                <tr key={row.state} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="py-2 font-medium">{row.state}</td>
                  <td className="py-2 text-right">{row.total}</td>
                  <td className="py-2 text-right text-green-600">{row.adopted}</td>
                  <td className="py-2 text-right text-orange-500">{row.transferred}</td>
                  <td className="py-2 text-right text-slate-600">
                    {row.total > 0 ? `${Math.round((row.adopted / row.total) * 100)}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}