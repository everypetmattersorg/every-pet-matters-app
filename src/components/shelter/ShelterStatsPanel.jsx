import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function ShelterStatsPanel({ pets = [] }) {
  const stats = useMemo(() => {
    const total = pets.length;
    const urgent = pets.filter(p => p.urgent).length;
    const transferNeeded = pets.filter(p => p.transfer_needed).length;
    const rescueNeeded = pets.filter(p => p.rescue_needed).length;
    const adopted = pets.filter(p => p.adoption_status === 'adopted').length;
    const shelters = new Set(pets.map(p => p.source).filter(Boolean)).size;
    return { total, urgent, transferNeeded, rescueNeeded, adopted, shelters };
  }, [pets]);

  const items = [
    { label: 'Total Animals', value: stats.total, color: 'text-slate-800' },
    { label: 'Shelters / Rescues', value: stats.shelters, color: 'text-indigo-600' },
    { label: 'Urgent', value: stats.urgent, color: 'text-red-500' },
    { label: 'Transfer Needed', value: stats.transferNeeded, color: 'text-orange-500' },
    { label: 'Rescue Needed', value: stats.rescueNeeded, color: 'text-amber-500' },
    { label: 'Adopted', value: stats.adopted, color: 'text-green-600' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map(item => (
        <Card key={item.label}>
          <CardContent className="pt-4 pb-3 text-center">
            <p className={`text-2xl font-bold ${item.color}`}>{item.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}