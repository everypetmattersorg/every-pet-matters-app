import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle2, XCircle, Mail, RefreshCw, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { Link } from 'react-router-dom';

function SetupBadge({ done, label }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      done ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
    }`}>
      {done ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}

export default function RescueSetupStatus() {
  const queryClient = useQueryClient();
  const [sendingEmail, setSendingEmail] = useState(null);

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['all-users-rescue'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: rescues = [], isLoading: loadingRescues } = useQuery({
    queryKey: ['all-rescues'],
    queryFn: () => base44.entities.Rescue.list(),
  });

  const { data: connections = [], isLoading: loadingConns } = useQuery({
    queryKey: ['all-connections'],
    queryFn: () => base44.entities.ShelterConnection.list(),
  });

  const rescueUsers = users.filter((u) => ['rescue', 'shelter', 'admin'].includes(u.role));

  const getSetupStatus = (user) => {
    const hasProfile = rescues.some((r) => r.email === user.email);
    const hasConnection = connections.some(
      (c) => c.contact_email === user.email || c.created_by === user.email
    );
    const hasActiveConnection = connections.some(
      (c) => (c.contact_email === user.email || c.created_by === user.email) && c.status === 'active'
    );
    const onboardingComplete = !!user.onboarding_complete;
    const completedSteps = [hasProfile, hasConnection, onboardingComplete].filter(Boolean).length;
    return { hasProfile, hasConnection, hasActiveConnection, onboardingComplete, completedSteps };
  };

  const handleSendSetupEmail = async (user) => {
    setSendingEmail(user.id);
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: 'Complete your every pet rescue profile',
      body: `Hi ${user.full_name || 'there'},\n\nYour every pet rescue account is ready! Please complete your profile setup here:\n\nhttps://everypetmatters.base44.app/RescueOnboarding\n\nThis only takes a few minutes and will help adopters find your animals.\n\nThanks,\nThe every pet team`,
    });
    toast.success(`Setup email sent to ${user.email}`);
    setSendingEmail(null);
  };

  const handleSetRole = async (user, role) => {
    await base44.entities.User.update(user.id, { role });
    queryClient.invalidateQueries({ queryKey: ['all-users-rescue'] });
    toast.success(`${user.full_name || user.email} set to ${role}`);
  };

  const isLoading = loadingUsers || loadingRescues || loadingConns;

  if (isLoading) return (
    <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
  );

  const incomplete = rescueUsers.filter((u) => getSetupStatus(u).completedSteps < 3);
  const complete = rescueUsers.filter((u) => getSetupStatus(u).completedSteps === 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Rescue &amp; Shelter Setup Progress</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{rescueUsers.length} rescue/shelter users · {incomplete.length} incomplete</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => queryClient.invalidateQueries()}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Incomplete users first */}
      {incomplete.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-orange-700">⚠️ Incomplete Setup ({incomplete.length})</p>
          {incomplete.map((user) => {
            const status = getSetupStatus(user);
            const initials = user.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase() || '?';
            return (
              <Card key={user.id} className="border-orange-200 bg-orange-50/30">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3 flex-wrap">
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarImage src={user.photo_url} />
                      <AvatarFallback className="bg-orange-100 text-sm">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <p className="font-semibold text-sm">{user.full_name || 'No name'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {user.affiliated_organization && (
                          <p className="text-xs text-muted-foreground">🏠 {user.affiliated_organization}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <SetupBadge done={status.hasProfile} label="Org Profile" />
                        <SetupBadge done={status.hasConnection} label="API Connected" />
                        <SetupBadge done={status.hasActiveConnection} label="Connection Active" />
                        <SetupBadge done={status.onboardingComplete} label="Onboarding Done" />
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div
                          className="bg-[#b1511d] h-1.5 rounded-full transition-all"
                          style={{ width: `${(status.completedSteps / 3) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs"
                        disabled={sendingEmail === user.id}
                        onClick={() => handleSendSetupEmail(user)}
                      >
                        {sendingEmail === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                        Send Setup Email
                      </Button>
                      {user.role === 'user' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs"
                          onClick={() => handleSetRole(user, 'rescue')}
                        >
                          Set as Rescue
                        </Button>
                      )}
                      <Link to="/ShelterSyncDashboard">
                        <Button size="sm" variant="ghost" className="gap-1 text-xs w-full">
                          <ExternalLink className="w-3 h-3" /> Sync Dashboard
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Complete users */}
      {complete.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-green-700">✅ Fully Set Up ({complete.length})</p>
          {complete.map((user) => {
            const status = getSetupStatus(user);
            const initials = user.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase() || '?';
            return (
              <Card key={user.id} className="border-green-200 bg-green-50/20">
                <CardContent className="py-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarImage src={user.photo_url} />
                      <AvatarFallback className="bg-green-100 text-sm">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{user.full_name || 'No name'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <SetupBadge done={status.hasProfile} label="Profile" />
                      <SetupBadge done={status.hasActiveConnection} label="API Active" />
                    </div>
                    <Badge className="bg-green-100 text-green-700 text-xs">Complete</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {rescueUsers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No rescue or shelter users yet. Assign the rescue or shelter role to users to track their setup here.
        </div>
      )}
    </div>
  );
}