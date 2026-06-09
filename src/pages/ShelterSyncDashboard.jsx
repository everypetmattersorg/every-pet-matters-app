import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, RefreshCw, Loader2, CheckCircle2, AlertCircle, Clock, WifiOff, Wifi, PawPrint, AlertTriangle, Pencil, ShieldOff } from 'lucide-react';
import EditConnectionModal from '@/components/shelter/EditConnectionModal';
import SyncAlertsBanner from '@/components/shelter/SyncAlertsBanner';
import AuditLogSection from '@/components/shelter/AuditLogSection';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  pending:      { label: 'Pending',      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock,         dot: 'bg-yellow-400' },
  active:       { label: 'Connected',    color: 'bg-green-100 text-green-800 border-green-200',   icon: CheckCircle2,  dot: 'bg-green-500' },
  error:        { label: 'Error',        color: 'bg-red-100 text-red-800 border-red-200',         icon: AlertCircle,   dot: 'bg-red-500' },
  disconnected: { label: 'Disconnected', color: 'bg-gray-100 text-gray-600 border-gray-200',      icon: WifiOff,       dot: 'bg-gray-400' },
};

function StatusDot({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot} ${status === 'active' ? 'animate-pulse' : ''}`} />
  );
}

function StatBox({ label, value, icon, highlight }) {
  return (
    <div className={`rounded-lg p-3 text-center ${highlight ? 'bg-red-50 border border-red-200' : 'bg-muted/50'}`}>
      <p className="text-lg font-bold">{icon} {value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function SyncCard({ conn, pets, onForceSync, syncing, onApprove, approving, onEdit, elapsedTime }) {
  const cfg = STATUS_CONFIG[conn.status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  const connPets = pets.filter(p =>
    p.source?.toLowerCase().includes(conn.shelter_name.toLowerCase()) ||
    conn.shelter_name.toLowerCase().includes(p.source?.toLowerCase() || '')
  );
  const urgentCount = connPets.filter(p => p.urgent).length;
  const errorStatus = conn.status === 'error';

  return (
    <Card className={`border ${errorStatus ? 'border-red-300 bg-red-50/30' : 'border-border'}`}>
      <CardContent className="pt-5 pb-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0">🏠</div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{conn.shelter_name}</p>
                <Badge className={`text-xs flex items-center gap-1 border ${cfg.color}`}>
                  <StatusDot status={conn.status} />
                  {cfg.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Wifi className="w-3 h-3" /> {conn.software_platform}
                {conn.contact_email && <> · {conn.contact_email}</>}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => onEdit(conn)}>
              <Pencil className="w-3 h-3" /> Edit
            </Button>
            <Button
              size="sm"
              variant={errorStatus ? 'destructive' : 'outline'}
              className="gap-1.5 text-xs"
              disabled={syncing === conn.id}
              onClick={() => onForceSync(conn)}
            >
              {syncing === conn.id
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Syncing ({elapsedTime}s)...</>
                : <><RefreshCw className="w-3 h-3" /> Force Sync</>
              }
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatBox label="Pets Synced" value={conn.pets_synced ?? connPets.length} icon="🐾" />
          <StatBox label="Urgent" value={urgentCount} icon="🚨" highlight={urgentCount > 0} />
          <StatBox label="Last Sync" value={conn.last_sync ? new Date(conn.last_sync).toLocaleDateString() : '—'} icon="🕐" />
        </div>

        {errorStatus && conn.notes && (
          <div className="flex items-start gap-2 p-3 bg-red-100 rounded-lg border border-red-200 text-xs text-red-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Import Error</p>
              <p>{conn.notes}</p>
            </div>
          </div>
        )}

        {conn.status === 'pending' && (
          <div className="flex items-center justify-between gap-3 p-2.5 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 text-xs text-yellow-800">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              Pending review — sync will activate once approved.
            </div>
            <Button
              size="sm"
              className="gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white shrink-0"
              disabled={approving === conn.id}
              onClick={() => onApprove(conn)}
            >
              {approving === conn.id
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Approving...</>
                : <><CheckCircle2 className="w-3 h-3" /> Approve</>
              }
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryCard({ label, value, icon, color }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4 text-center">
        <p className={`text-2xl font-bold ${color || ''}`}>{icon} {value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

export default function ShelterSyncDashboard() {
  const [syncing, setSyncing] = useState(null);
  const [syncStartTime, setSyncStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [approving, setApproving] = useState(null);
  const [editingConn, setEditingConn] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!syncing || !syncStartTime) return;
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - syncStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [syncing, syncStartTime]);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: connections = [], isLoading: connsLoading, refetch: refetchConns } = useQuery({
    queryKey: ['shelter-connections'],
    queryFn: () => base44.entities.ShelterConnection.list('-created_date', 100),
    refetchInterval: 30000,
    enabled: user?.role === 'admin',
  });

  const { data: pets = [], isLoading: petsLoading } = useQuery({
    queryKey: ['pets-sync-dashboard'],
    queryFn: () => base44.entities.Pet.list('-created_date', 500),
    refetchInterval: 30000,
    enabled: user?.role === 'admin',
  });

  const handleApprove = async (conn) => {
    setApproving(conn.id);
    try {
      await base44.entities.ShelterConnection.update(conn.id, { status: 'active' });
      toast.success(`${conn.shelter_name} approved and activated!`);
      queryClient.invalidateQueries({ queryKey: ['shelter-connections'] });
    } catch (err) {
      toast.error('Failed to approve: ' + err.message);
    } finally {
      setApproving(null);
    }
  };

  const handleForceSync = async (conn) => {
    setSyncing(conn.id);
    setSyncStartTime(Date.now());
    setElapsedTime(0);
    try {
      if (conn.software_platform === 'ShelterLuv') {
        await base44.functions.invoke('syncShelterLuvAnimals', { connection_id: conn.id }, { timeout: 20 * 60 * 1000 });
      } else {
        await base44.functions.invoke('syncAllPetPhotos', {});
      }
      toast.success(`Sync triggered for ${conn.shelter_name}!`);
      queryClient.invalidateQueries({ queryKey: ['shelter-connections'] });
      queryClient.invalidateQueries({ queryKey: ['pets-sync-dashboard'] });
      refetchConns();
    } catch (err) {
      toast.error('Sync failed: ' + err.message);
    } finally {
      setSyncing(null);
      setSyncStartTime(null);
      setElapsedTime(0);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <ShieldOff className="w-12 h-12 text-muted-foreground opacity-50" />
        <div>
          <p className="text-xl font-semibold">Access Denied</p>
          <p className="text-muted-foreground mt-1">This dashboard is restricted to administrators only.</p>
        </div>
        <Link to="/"><Button variant="outline">Go Home</Button></Link>
      </div>
    );
  }

  const errorConns = connections.filter(c => c.status === 'error');
  const activeConns = connections.filter(c => c.status === 'active');
  const isLoading = connsLoading || petsLoading;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <Link to="/ShelterPortal">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Shelter Portal
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold leading-tight">Sync Dashboard</h1>
              <p className="text-xs text-muted-foreground">Real-time import status for all connections</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { refetchConns(); queryClient.invalidateQueries({ queryKey: ['pets-sync-dashboard'] }); }}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh All
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <SyncAlertsBanner onEditConn={(connId) => {
          const conn = connections.find(c => c.id === connId);
          if (conn) setEditingConn(conn);
        }} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard label="Total Connections" value={connections.length} icon="🔌" />
          <SummaryCard label="Active" value={activeConns.length} icon="✅" color="text-green-700" />
          <SummaryCard label="Errors" value={errorConns.length} icon="❌" color={errorConns.length > 0 ? 'text-red-600' : undefined} />
          <SummaryCard label="Total Pets" value={pets.length} icon="🐾" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-muted-foreground" /></div>
        ) : connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground text-center">
            <PawPrint className="w-10 h-10 opacity-30" />
            <p className="font-medium">No shelter connections yet.</p>
            <Link to="/ShelterPortal"><Button variant="outline" size="sm">Add a Connection</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">All Connections</h2>
            {connections.map(conn => (
              <SyncCard
                key={conn.id}
                conn={conn}
                pets={pets}
                onForceSync={handleForceSync}
                syncing={syncing}
                onApprove={handleApprove}
                approving={approving}
                onEdit={setEditingConn}
                elapsedTime={elapsedTime}
              />
            ))}
          </div>
        )}

        <AuditLogSection />
      </div>

      <EditConnectionModal
        conn={editingConn}
        open={!!editingConn}
        onClose={() => setEditingConn(null)}
        onSaved={() => { refetchConns(); queryClient.invalidateQueries({ queryKey: ['shelter-connections'] }); }}
      />
    </div>
  );
}