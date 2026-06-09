import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Users, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import ShelterStatsPanel from '@/components/shelter/ShelterStatsPanel';
import ShelterBreakdownTable from '@/components/shelter/ShelterBreakdownTable';
import IntakeTransferChart from '@/components/shelter/IntakeTransferChart';
import AdoptedTransferredMap from '@/components/shelter/AdoptedTransferredMap';
import DailyActiveUsersChart from '@/components/shelter/DailyActiveUsersChart';
import DailyNewUsersChart from '@/components/shelter/DailyNewUsersChart';

export default function AdminAnalytics() {
  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ['all-pets-admin'],
    queryFn: () => base44.entities.Pet.list('-created_date', 2000),
    enabled: user?.role === 'admin'
  });

  const { data: connections = [] } = useQuery({
    queryKey: ['all-connections-admin'],
    queryFn: () => base44.entities.ShelterConnection.list('-created_date', 100),
    enabled: user?.role === 'admin'
  });

  const { data: allInvites = [] } = useQuery({
    queryKey: ['all-invites-admin'],
    queryFn: () => base44.entities.Invite.list('-created_date', 2000),
    enabled: user?.role === 'admin'
  });

  const stateData = useMemo(() => {
    const counts = {};
    for (const pet of pets) {
      if (!pet.location) continue;
      const parts = pet.location.split(',');
      const state = parts[parts.length - 1].trim();
      if (state) counts[state] = (counts[state] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [pets]);

  const speciesData = useMemo(() => {
    const counts = {};
    for (const pet of pets) {
      const s = pet.species || 'Unknown';
      counts[s] = (counts[s] || 0) + 1;
    }
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [pets]);

  const SPECIES_COLORS = ['#6366f1','#f97316','#22c55e','#f43f5e','#a855f7','#06b6d4','#eab308','#ec4899'];

  const topSheltersData = useMemo(() => {
    const shelterSpecies = {};
    for (const pet of pets) {
      const shelter = pet.source || 'Unknown';
      const species = pet.species || 'Unknown';
      if (!shelterSpecies[shelter]) shelterSpecies[shelter] = { total: 0 };
      shelterSpecies[shelter].total += 1;
      shelterSpecies[shelter][species] = (shelterSpecies[shelter][species] || 0) + 1;
    }
    const top5 = Object.entries(shelterSpecies)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([name, counts]) => ({ name, ...counts }));
    return top5;
  }, [pets]);

  const topShelterSpecies = useMemo(() => {
    const speciesSet = new Set();
    for (const pet of pets) speciesSet.add(pet.species || 'Unknown');
    return [...speciesSet];
  }, [pets]);

  const referralData = useMemo(() => {
    const sent = {};
    const joined = {};
    for (const invite of allInvites) {
      sent[invite.inviter_email] = (sent[invite.inviter_email] || 0) + 1;
      if (invite.signup_status === 'accepted') {
        joined[invite.inviter_email] = (joined[invite.inviter_email] || 0) + 1;
      }
    }
    return Object.keys(sent)
      .map(email => ({ name: email.split('@')[0], email, sent: sent[email], joined: joined[email] || 0 }))
      .sort((a, b) => b.sent - a.sent)
      .slice(0, 15);
  }, [allInvites]);

  const referralTotals = useMemo(() => ({
    totalSent: allInvites.length,
    totalJoined: allInvites.filter(i => i.signup_status === 'accepted').length,
  }), [allInvites]);

  const downloadCSV = () => {
    const headers = ['Name','Species','Breed','Age','Gender','Size','Weight (lbs)','Location','Source','Adoption Status','Outreach Status','Contact','Vaccinated','Spayed/Neutered','Urgent','Rescue Needed','Transfer Needed','Stipend Available','URL'];
    const rows = pets.map(p => [
      p.name, p.species, p.breed, p.age, p.gender, p.size, p.weight,
      p.location, p.source, p.adoption_status, p.outreach_status, p.contact,
      p.vaccinated ? 'Yes' : 'No', p.spayed_neutered ? 'Yes' : 'No',
      p.urgent ? 'Yes' : 'No', p.rescue_needed ? 'Yes' : 'No',
      p.transfer_needed ? 'Yes' : 'No', p.stipend_available ? 'Yes' : 'No', p.url
    ].map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`));
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `pets-export-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-red-500">Access Denied</p>
          <p className="text-muted-foreground mt-1">Admin access required.</p>
          <Link to="/"><Button className="mt-4" variant="outline">Go Home</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Admin Analytics</h1>
            <p className="text-sm text-muted-foreground">all rescue center statistics</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={downloadCSV} disabled={pets.length === 0}>
            <Download className="w-4 h-4" /> Download CSV
          </Button>
          <Link to="/AdminUsers">
            <Button variant="outline" className="gap-2">
              <Users className="w-4 h-4" /> Manage Users
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <ShelterStatsPanel pets={pets} />

            <DailyActiveUsersChart />

            <DailyNewUsersChart />

            <IntakeTransferChart pets={pets} />

            {stateData.length > 0 && (
              <Card>
                <CardContent className="pt-5">
                  <p className="text-sm font-semibold mb-4">Animals by State (Top 20)</p>
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart data={stateData} margin={{ top: 0, right: 10, left: -10, bottom: 80 }}>
                      <XAxis dataKey="state" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" interval={0} height={80} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {stateData.map((_, i) => (
                          <Cell key={i} fill={['#f97316','#6366f1','#22c55e','#f43f5e','#a855f7','#06b6d4'][i % 6]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {topSheltersData.length > 0 && (
              <Card>
                <CardContent className="pt-5">
                  <p className="text-sm font-semibold mb-4">Top 5 Shelters / Rescues by Pet Uploads</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topSheltersData} margin={{ top: 0, right: 10, left: -10, bottom: 60 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} height={70} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} />
                      {topShelterSpecies.map((species, i) => (
                        <Bar key={species} dataKey={species} stackId="a" fill={SPECIES_COLORS[i % SPECIES_COLORS.length]} radius={i === topShelterSpecies.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {speciesData.length > 0 && (
              <Card>
                <CardContent className="pt-5">
                  <p className="text-sm font-semibold mb-4">Animals by Species</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={speciesData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {speciesData.map((_, i) => (
                          <Cell key={i} fill={['#6366f1','#f97316','#22c55e','#f43f5e','#a855f7','#06b6d4'][i % 6]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Referral Stats */}
            {allInvites.length > 0 && (
              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold">Referrals Overview</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-amber-600 font-medium">{referralTotals.totalSent} invites sent</span>
                      <span className="text-green-600 font-medium">{referralTotals.totalJoined} joined</span>
                      <span className="text-slate-500">{referralTotals.totalSent > 0 ? Math.round((referralTotals.totalJoined / referralTotals.totalSent) * 100) : 0}% conversion</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={referralData} margin={{ top: 0, right: 10, left: -10, bottom: 60 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} height={70} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip formatter={(val, name) => [val, name === 'sent' ? 'Invites Sent' : 'Joined']} labelFormatter={(label, payload) => payload?.[0]?.payload?.email || label} />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="sent" name="Invites Sent" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="joined" name="Joined" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <AdoptedTransferredMap pets={pets} />

            <ShelterBreakdownTable pets={pets} />

            <div className="bg-white border rounded-xl p-5">
              <h2 className="font-semibold mb-3">Shelter Connections ({connections.length})</h2>
              {connections.length === 0 ? (
                <p className="text-sm text-muted-foreground">No connections registered.</p>
              ) : (
                <div className="space-y-2">
                  {connections.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{c.shelter_name}</p>
                        <p className="text-xs text-muted-foreground">{c.software_platform} · {c.contact_email}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{c.status || 'pending'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}