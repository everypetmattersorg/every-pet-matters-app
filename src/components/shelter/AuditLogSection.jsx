import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function AuditLogSection() {
  const { data: syncLogs = [], isLoading } = useQuery({
    queryKey: ['sync-logs'],
    queryFn: () => base44.entities.SyncLog.list('-created_date', 50),
  });

  if (isLoading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );

  if (syncLogs.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Sync Audit Log</h2>
      <Card>
        <CardContent className="pt-4 pb-2">
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {syncLogs.map(log => (
              <div key={log.id} className="flex items-start justify-between gap-3 py-2 border-b last:border-0 text-xs">
                <div className="flex-1">
                  <p className="font-medium">{log.shelter_name || log.source || 'Unknown'}</p>
                  <p className="text-muted-foreground mt-0.5">{log.message || log.action || 'Sync event'}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    log.status === 'success' ? 'bg-green-100 text-green-700'
                    : log.status === 'error' ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600'
                  }`}>
                    {log.status || 'info'}
                  </span>
                  <p className="text-muted-foreground mt-1">{new Date(log.created_date).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}