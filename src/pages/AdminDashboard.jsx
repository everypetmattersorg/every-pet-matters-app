import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Users, ShieldAlert, ShieldCheck, ShieldOff,
  Trash2, RefreshCw, CheckCircle2, AlertCircle, Clock, WifiOff,
  Wifi, PawPrint, AlertTriangle, Pencil, Download, BarChart3
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import ShelterStatsPanel from '@/components/shelter/ShelterStatsPanel';
import ShelterBreakdownTable from '@/components/shelter/ShelterBreakdownTable';
import IntakeTransferChart from '@/components/shelter/IntakeTransferChart';
import AdoptedTransferredMap from '@/components/shelter/AdoptedTransferredMap';
import DailyActiveUsersChart from '@/components/shelter/DailyActiveUsersChart';
import DailyNewUsersChart from '@/components/shelter/DailyNewUsersChart';
import EditConnectionModal from '@/components/shelter/EditConnectionModal';
import SyncAlertsBanner from '@/components/shelter/SyncAlertsBanner';
import AuditLogSection from '@/components/shelter/AuditLogSection';
import OrganizationManager from '@/components/admin/OrganizationManager';
import PetAssignmentManager from '@/components/admin/PetAssignmentManager';
import ShelterConnectionsManager from '@/components/admin/ShelterConnectionsManager';

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:      { label: 'Pending',      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock,        dot: 'bg-yellow-400' },
  active:       { label: 'Connected',    color: 'bg-green-100 text-green-800 border-green-200',   icon: CheckCircle2, dot: 'bg-green-500' },
  error:        { label: 'Error',        color: 'bg-red-100 text-red-800 border-red-200',         icon: AlertCircle,  dot: 'bg-red-500' },
  disconnected: { label: 'Disconnected', color: 'bg-gray-100 text-gray-600 border-gray-200',      icon: WifiOff,      dot: 'bg-gray-400' },
};

function StatusDot({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot} ${status === 'active' ? 'animate-pulse' : ''}`} />;
}

// ─── Users Tab ───────────────────────────────────────────────────────────────
function UsersTab({ currentUser }) {
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const handleRoleChange = async (user, newRole) => {
    setUpdatingId(user.id);
    await base44.entities.User.update(user.id, { role: newRole });
    queryClient.invalidateQueries({ queryKey: ['all-users'] });
    toast.success(`${user.full_name || user.email} is now ${newRole}`);
    setUpdatingId(null);
  };

  const handleDelete = async (user) => {
    if (!confirm(`Delete ${user.full_name || user.email}? This cannot be undone.`)) return;
    setDeletingId(user.id);
    await base44.entities.User.delete(user.id);
    queryClient.invalidateQueries({ queryKey: ['all-users'] });
    toast.success(`${user.full_name || user.email} deleted`);
    setDeletingId(null);
  };

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
      {users.map((user) => {
        const initials = user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
        return (
          <Card key={user.id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Avatar className="w-12 h-12 shrink-0">
                  <AvatarImage src={user.photo_url} />
                  <AvatarFallback className="bg-primary/10 text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{user.full_name || 'No name'}</p>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">{user.role || 'user'}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.title && <p className="text-xs text-muted-foreground mt-0.5">{user.title}</p>}
                  {user.affiliated_organization && <p className="text-xs text-muted-foreground mt-0.5">🏠 {user.affiliated_organization}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">Joined {new Date(user.created_date).toLocaleDateString()}</p>
                </div>
                {user.id !== currentUser?.id && (
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="gap-1 text-xs text-red-600 border-red-200 hover:bg-red-50" disabled={deletingId === user.id} onClick={() => handleDelete(user)}>
                      {deletingId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Delete
                    </Button>
                    {user.role === 'admin' ? (
                      <Button size="sm" variant="outline" className="gap-1 text-xs" disabled={updatingId === user.id} onClick={() => handleRoleChange(user, 'user')}>
                        {updatingId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldOff className="w-3 h-3" />} Downgrade to User
                      </Button>
                    ) : (
                      <Button size="sm" className="gap-1 text-xs bg-[#708238] hover:bg-[#5a6a2c] text-white" disabled={updatingId === user.id} onClick={() => handleRoleChange(user, 'admin')}>
                        {updatingId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />} Upgrade to Admin
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const { data: pets = [], isLoading } = useQuery({
    queryKey: ['all-pets-admin'],
    queryFn: () => base44.entities.Pet.list('-created_date', 2000),
  });

  const stateData = useMemo(() => {
    const counts = {};
    for (const pet of pets) {
      if (!pet.location) continue;
      const parts = pet.location.split(',');
      const state = parts[parts.length - 1].trim();
      if (state) counts[state] = (counts[state] || 0) + 1;
    }
    return Object.entries(counts).map(([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count).slice(0, 20);
  }, [pets]);

  const speciesData = useMemo(() => {
    const counts = {};
    for (const pet of pets) { const s = pet.species || 'Unknown'; counts[s] = (counts[s] || 0) + 1; }
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [pets]);

  const topSheltersData = useMemo(() => {
    const shelterSpecies = {};
    for (const pet of pets) {
      const shelter = pet.source || 'Unknown';
      const species = pet.species || 'Unknown';
      if (!shelterSpecies[shelter]) shelterSpecies[shelter] = { total: 0 };
      shelterSpecies[shelter].total += 1;
      shelterSpecies[shelter][species] = (shelterSpecies[shelter][species] || 0) + 1;
    }
    return Object.entries(shelterSpecies).sort((a, b) => b[1].total - a[1].total).slice(0, 5).map(([name, counts]) => ({ name, ...counts }));
  }, [pets]);

  const topShelterSpecies = useMemo(() => {
    const speciesSet = new Set();
    for (const pet of pets) speciesSet.add(pet.species || 'Unknown');
    return [...speciesSet];
  }, [pets]);

  const COLORS = ['#6366f1','#f97316','#22c55e','#f43f5e','#a855f7','#06b6d4','#eab308','#ec4899'];

  const downloadCSV = () => {
    const headers = ['Name','Species','Breed','Age','Gender','Location','Source','Adoption Status','Urgent'];
    const rows = pets.map(p => [p.name, p.species, p.breed, p.age, p.gender, p.location, p.source, p.adoption_status, p.urgent ? 'Yes' : 'No'].map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`));
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `pets-export-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2" onClick={downloadCSV} disabled={pets.length === 0}>
          <Download className="w-4 h-4" /> Download CSV
        </Button>
      </div>
      <ShelterStatsPanel pets={pets} />
      <DailyActiveUsersChart />
      <DailyNewUsersChart />
      <IntakeTransferChart pets={pets} />
      {stateData.length > 0 && (
        <Card><CardContent className="pt-5">
          <p className="text-sm font-semibold mb-4">Animals by State (Top 20)</p>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={stateData} margin={{ top: 0, right: 10, left: -10, bottom: 80 }}>
              <XAxis dataKey="state" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" interval={0} height={80} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4,4,0,0]}>{stateData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>
      )}
      {topSheltersData.length > 0 && (
        <Card><CardContent className="pt-5">
          <p className="text-sm font-semibold mb-4">Top 5 Shelters by Pet Uploads</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSheltersData} margin={{ top: 0, right: 10, left: -10, bottom: 60 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} height={70} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip /><Legend verticalAlign="top" height={36} />
              {topShelterSpecies.map((species, i) => <Bar key={species} dataKey={species} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === topShelterSpecies.length - 1 ? [4,4,0,0] : [0,0,0,0]} />)}
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>
      )}
      {speciesData.length > 0 && (
        <Card><CardContent className="pt-5">
          <p className="text-sm font-semibold mb-4">Animals by Species</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={speciesData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4,4,0,0]}>{speciesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card>
      )}
      <AdoptedTransferredMap pets={pets} />
      <ShelterBreakdownTable pets={pets} />
    </div>
  );
}

// ─── Connections Tab ──────────────────────────────────────────────────────────
function ConnectionsTab() {
  const [syncing, setSyncing] = useState(null);
  const [syncStartTime, setSyncStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [approving, setApproving] = useState(null);
  const [editingConn, setEditingConn] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!syncing || !syncStartTime) return;
    const timer = setInterval(() => setElapsedTime(Math.floor((Date.now() - syncStartTime) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [syncing, syncStartTime]);

  const { data: connections = [], isLoading: connsLoading, refetch: refetchConns } = useQuery({
    queryKey: ['shelter-connections'],
    queryFn: () => base44.entities.ShelterConnection.list('-created_date', 100),
    refetchInterval: 30000,
  });

  const { data: pets = [], isLoading: petsLoading } = useQuery({
    queryKey: ['pets-sync-dashboard'],
    queryFn: () => base44.entities.Pet.list('-created_date', 500),
    refetchInterval: 30000,
  });

  const handleApprove = async (conn) => {
    setApproving(conn.id);
    await base44.entities.ShelterConnection.update(conn.id, { status: 'active' });
    toast.success(`${conn.shelter_name} approved and activated!`);
    queryClient.invalidateQueries({ queryKey: ['shelter-connections'] });
    setApproving(null);
  };

  const handleForceSync = async (conn) => {
    setSyncing(conn.id); setSyncStartTime(Date.now()); setElapsedTime(0);
    try {
      const platform = conn.software_platform?.toLowerCase();
      let endpoint = null;
      if (platform === 'shelterluv') endpoint = '/api/sync-shelterluv';
      else if (platform === 'adopt-a-pet') endpoint = '/api/sync-adoptapet';

      if (endpoint) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ connection_id: conn.id }),
        });
        const text = await res.text();
        console.log('[sync response]', res.status, text);
        const data = text ? JSON.parse(text) : {};
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}: ${text.slice(0, 200)}`);
        toast.success(`Synced ${data.animals_synced ?? 0} animals for ${conn.shelter_name}!`);
      } else {
        toast.info(`Sync for ${conn.software_platform} is not yet supported.`);
      }
      queryClient.invalidateQueries({ queryKey: ['shelter-connections'] });
      queryClient.invalidateQueries({ queryKey: ['pets-sync-dashboard'] });
    } catch (err) {
      toast.error('Sync failed: ' + err.message);
    } finally {
      setSyncing(null); setSyncStartTime(null); setElapsedTime(0);
    }
  };

  const handleDelete = async (conn) => {
    if (!confirm(`Remove connection for ${conn.shelter_name}?`)) return;
    await base44.entities.ShelterConnection.delete(conn.id);
    toast.success('Connection removed');
    refetchConns();
  };

  const isLoading = connsLoading || petsLoading;
  const errorConns = connections.filter(c => c.status === 'error');
  const activeConns = connections.filter(c => c.status === 'active');
  const pendingConns = connections.filter(c => c.status === 'pending');

  return (
    <div className="space-y-6">
      <SyncAlertsBanner onEditConn={(connId) => { const conn = connections.find(c => c.id === connId); if (conn) setEditingConn(conn); }} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: connections.length, icon: '🔌' },
          { label: 'Active', value: activeConns.length, icon: '✅', color: 'text-green-700' },
          { label: 'Pending', value: pendingConns.length, icon: '⏳', color: pendingConns.length > 0 ? 'text-yellow-600' : undefined },
          { label: 'Errors', value: errorConns.length, icon: '❌', color: errorConns.length > 0 ? 'text-red-600' : undefined },
        ].map(({ label, value, icon, color }) => (
          <Card key={label}><CardContent className="pt-4 pb-4 text-center">
            <p className={`text-2xl font-bold ${color || ''}`}>{icon} {value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { refetchConns(); queryClient.invalidateQueries({ queryKey: ['pets-sync-dashboard'] }); }}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh All
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-muted-foreground" /></div>
      ) : connections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground text-center">
          <PawPrint className="w-10 h-10 opacity-30" />
          <p className="font-medium">No shelter connections yet.</p>
          <Link to="/ShelterPortal"><Button variant="outline" size="sm">Go to Shelter Portal</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map(conn => {
            const cfg = STATUS_CONFIG[conn.status] || STATUS_CONFIG.pending;
            const connPets = pets.filter(p => p.source?.toLowerCase().includes(conn.shelter_name.toLowerCase()) || conn.shelter_name.toLowerCase().includes(p.source?.toLowerCase() || ''));
            const urgentCount = connPets.filter(p => p.urgent).length;
            const errorStatus = conn.status === 'error';

            return (
              <Card key={conn.id} className={`border ${errorStatus ? 'border-red-300 bg-red-50/30' : 'border-border'}`}>
                <CardContent className="pt-5 pb-4 space-y-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0">🏠</div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{conn.shelter_name}</p>
                          <Badge className={`text-xs flex items-center gap-1 border ${cfg.color}`}>
                            <StatusDot status={conn.status} /> {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Wifi className="w-3 h-3" /> {conn.software_platform}
                          {conn.contact_email && <> · {conn.contact_email}</>}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 flex-wrap">
                      <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => setEditingConn(conn)}><Pencil className="w-3 h-3" /> Edit</Button>
                      <Button size="sm" variant={errorStatus ? 'destructive' : 'outline'} className="gap-1.5 text-xs" disabled={syncing === conn.id} onClick={() => handleForceSync(conn)}>
                        {syncing === conn.id ? <><Loader2 className="w-3 h-3 animate-spin" /> Syncing ({elapsedTime}s)...</> : <><RefreshCw className="w-3 h-3" /> Force Sync</>}
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-red-600 hover:bg-red-50" onClick={() => handleDelete(conn)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Pets Synced', value: conn.pets_synced ?? connPets.length, icon: '🐾' },
                      { label: 'Urgent', value: urgentCount, icon: '🚨', highlight: urgentCount > 0 },
                      { label: 'Last Sync', value: conn.last_sync ? new Date(conn.last_sync).toLocaleDateString() : '—', icon: '🕐' },
                    ].map(({ label, value, icon, highlight }) => (
                      <div key={label} className={`rounded-lg p-3 text-center ${highlight ? 'bg-red-50 border border-red-200' : 'bg-muted/50'}`}>
                        <p className="text-lg font-bold">{icon} {value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  {errorStatus && conn.notes && (
                    <div className="flex items-start gap-2 p-3 bg-red-100 rounded-lg border border-red-200 text-xs text-red-800">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div><p className="font-semibold mb-0.5">Import Error</p><p>{conn.notes}</p></div>
                    </div>
                  )}

                  {conn.status === 'pending' && (
                    <div className="flex items-center justify-between gap-3 p-2.5 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-2 text-xs text-yellow-800">
                        <Clock className="w-3.5 h-3.5 shrink-0" /> Pending review — activate to start syncing.
                      </div>
                      <Button size="sm" className="gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white shrink-0" disabled={approving === conn.id} onClick={() => handleApprove(conn)}>
                        {approving === conn.id ? <><Loader2 className="w-3 h-3 animate-spin" /> Approving...</> : <><CheckCircle2 className="w-3 h-3" /> Approve</>}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AuditLogSection />

      <EditConnectionModal conn={editingConn} open={!!editingConn} onClose={() => setEditingConn(null)} onSaved={() => { refetchConns(); queryClient.invalidateQueries({ queryKey: ['pets-sync-dashboard'] }); }} />
    </div>
  );
}

// ─── Sync Logs Tab ────────────────────────────────────────────────────────────
function SyncLogsTab() {
  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['sync-logs-admin'],
    queryFn: () => base44.entities.SyncLog.list('-created_date', 200),
  });

  const statusColor = { success: 'bg-green-100 text-green-800', error: 'bg-red-100 text-red-800', partial: 'bg-yellow-100 text-yellow-800' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{logs.length} log entries</p>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-muted-foreground" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-medium">No sync logs yet.</p>
          <p className="text-sm mt-1">Logs will appear here after shelter syncs run.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <Card key={log.id}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium text-sm">{log.rescue_email}</p>
                      <Badge className={`text-xs ${statusColor[log.status] || 'bg-gray-100 text-gray-600'}`}>{log.status}</Badge>
                      <span className="text-xs text-muted-foreground">{log.api_provider} · {log.sync_type}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {log.pets_synced != null && <span>🐾 {log.pets_synced} pets synced</span>}
                      {log.applications_synced != null && <span>📋 {log.applications_synced} apps</span>}
                      {log.duration_seconds != null && <span>⏱ {log.duration_seconds}s</span>}
                    </div>
                    {log.error_message && (
                      <p className="text-xs text-red-600 mt-1 font-mono bg-red-50 px-2 py-1 rounded">{log.error_message}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{new Date(log.created_date).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { data: user, isLoading } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (user?.role !== 'admin') return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
      <ShieldAlert className="w-16 h-16 text-red-400" />
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground">This page is restricted to administrators only.</p>
      <Link to="/"><Button variant="outline">Go Home</Button></Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link to="/"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button></Link>
          <div className="flex items-center gap-2 flex-1">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <Badge variant="secondary" className="text-xs">Admin Only</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
         <Tabs defaultValue="users">
           <TabsList className="grid w-full grid-cols-7 mb-6">
             <TabsTrigger value="users"><Users className="w-4 h-4 mr-1.5" /> Users</TabsTrigger>
             <TabsTrigger value="organizations">🏢 Orgs</TabsTrigger>
             <TabsTrigger value="pets">🐾 Pets</TabsTrigger>
             <TabsTrigger value="integrations">🔌 Integrations</TabsTrigger>
             <TabsTrigger value="analytics"><BarChart3 className="w-4 h-4 mr-1.5" /> Analytics</TabsTrigger>
             <TabsTrigger value="connections"><Wifi className="w-4 h-4 mr-1.5" /> Connections</TabsTrigger>
             <TabsTrigger value="logs"><Clock className="w-4 h-4 mr-1.5" /> Logs</TabsTrigger>
           </TabsList>

          <TabsContent value="users"><UsersTab currentUser={user} /></TabsContent>
          <TabsContent value="organizations"><OrganizationManager /></TabsContent>
          <TabsContent value="pets"><PetAssignmentManager /></TabsContent>
          <TabsContent value="integrations"><ShelterConnectionsManager /></TabsContent>
          <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
          <TabsContent value="connections"><ConnectionsTab /></TabsContent>
          <TabsContent value="logs"><SyncLogsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}