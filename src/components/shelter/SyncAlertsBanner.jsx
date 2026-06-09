import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SyncAlertsBanner({ onEditConn }) {
  const { data: connections = [] } = useQuery({
    queryKey: ['shelter-connections'],
    queryFn: () => base44.entities.ShelterConnection.list('-created_date', 100),
  });

  const errorConns = connections.filter(c => c.status === 'error');

  if (errorConns.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold text-sm text-red-800">
          {errorConns.length} connection{errorConns.length > 1 ? 's have' : ' has'} sync errors
        </p>
        <div className="mt-2 space-y-1">
          {errorConns.map(conn => (
            <div key={conn.id} className="flex items-center justify-between gap-3">
              <p className="text-xs text-red-700">{conn.shelter_name} — {conn.notes || 'Unknown error'}</p>
              <Button size="sm" variant="outline" className="text-xs h-6 px-2 shrink-0" onClick={() => onEditConn(conn.id)}>
                Fix
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}