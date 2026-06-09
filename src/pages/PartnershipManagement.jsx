import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Check, X, Clock, CheckCircle2, Edit2 } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  active: { label: 'Active', color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-800', icon: X },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: Check },
};

function ImpactDialog({ partnership, open, onClose, onSaved }) {
  const [form, setForm] = useState({
    animals_transferred: partnership?.animals_transferred || 0,
    impact_notes: partnership?.impact_notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.ShelterPartnership.update(partnership.id, {
      animals_transferred: parseInt(form.animals_transferred) || 0,
      impact_notes: form.impact_notes,
    });
    toast.success('Partnership impact updated!');
    onSaved();
    onClose();
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Partnership Impact</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="animals">Animals Transferred</Label>
            <Input
              id="animals"
              type="number"
              min="0"
              value={form.animals_transferred}
              onChange={e => setForm(f => ({ ...f, animals_transferred: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="notes">Impact Notes</Label>
            <Textarea
              id="notes"
              value={form.impact_notes}
              onChange={e => setForm(f => ({ ...f, impact_notes: e.target.value }))}
              placeholder="Describe the outcomes and impact of this partnership..."
              rows={4}
              className="mt-1.5"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Save Impact'}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PartnershipManagement() {
  const [editingPartnership, setEditingPartnership] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['partnership-user'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: partnerships = [], isLoading, refetch } = useQuery({
    queryKey: ['partnerships', user?.email],
    queryFn: () => base44.entities.ShelterPartnership.list('-created_date', 500),
    enabled: !!user,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['partnership-notifications', user?.email],
    queryFn: () => base44.entities.PartnershipNotification.filter({ recipient_email: user?.email }, '-created_date', 100),
    enabled: !!user,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const userPartnerships = partnerships.filter(p =>
    p.initiator_email === user?.email || p.partner_email === user?.email
  );

  const filteredPartnerships = statusFilter === 'all'
    ? userPartnerships
    : userPartnerships.filter(p => p.status === statusFilter);

  const handleStatusUpdate = async (partnership, newStatus) => {
    await base44.entities.ShelterPartnership.update(partnership.id, { status: newStatus });

    const partnerEmail = partnership.initiator_email === user?.email ? partnership.partner_email : partnership.initiator_email;
    const statusMessages = {
      active: `Partnership with ${partnership.initiator_email === user?.email ? partnership.partner_shelter_name : partnership.initiator_shelter_name} is now active!`,
      declined: `Partnership request declined.`,
      completed: `Partnership with ${partnership.initiator_email === user?.email ? partnership.partner_shelter_name : partnership.initiator_shelter_name} has been completed.`,
    };

    await base44.functions.invoke('handlePartnershipNotification', {
      partnership_id: partnership.id,
      event_type: newStatus === 'active' ? 'partnership_active' : newStatus === 'declined' ? 'request_declined' : 'partnership_completed',
      recipient_email: partnerEmail,
      sender_name: user?.affiliated_organization || user?.full_name,
      message: statusMessages[newStatus],
    });

    toast.success('Partnership status updated!');
    refetch();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/ShelterPortal">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Partnerships</h1>
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-800">{unreadCount} new update{unreadCount !== 1 ? 's' : ''}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'active', 'declined', 'completed'].map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>

        {unreadCount > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900">
                You have {unreadCount} new partnership update{unreadCount !== 1 ? 's' : ''}. Check your email for details.
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredPartnerships.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">No partnerships found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPartnerships.map(partnership => {
              const statusCfg = STATUS_CONFIG[partnership.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusCfg.icon;
              const isInitiator = partnership.initiator_email === user?.email;
              const otherParty = isInitiator ? partnership.partner_shelter_name : partnership.initiator_shelter_name;

              return (
                <Card key={partnership.id}>
                  <CardContent className="pt-6 pb-4">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{otherParty}</h3>
                            <Badge className={`${statusCfg.color} flex items-center gap-1 text-xs`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusCfg.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {isInitiator ? 'You initiated this partnership' : 'This shelter initiated the partnership'}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => setEditingPartnership(partnership)}
                        >
                          <Edit2 className="w-3 h-3" /> Impact
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Animals Transferred</p>
                          <p className="text-lg font-semibold">{partnership.animals_transferred || 0}</p>
                        </div>
                        {partnership.impact_notes && (
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">Impact Notes</p>
                            <p className="text-sm text-foreground">{partnership.impact_notes}</p>
                          </div>
                        )}
                      </div>

                      {partnership.notes && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Partnership Notes</p>
                          <p className="text-sm text-muted-foreground">{partnership.notes}</p>
                        </div>
                      )}

                      {partnership.status === 'pending' && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Button size="sm" className="flex-1 gap-1" onClick={() => handleStatusUpdate(partnership, 'active')}>
                            <Check className="w-3 h-3" /> Accept
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => handleStatusUpdate(partnership, 'declined')}>
                            <X className="w-3 h-3" /> Decline
                          </Button>
                        </div>
                      )}

                      {partnership.status === 'active' && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => handleStatusUpdate(partnership, 'completed')}>
                            Mark Complete
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {editingPartnership && (
        <ImpactDialog
          partnership={editingPartnership}
          open={!!editingPartnership}
          onClose={() => setEditingPartnership(null)}
          onSaved={refetch}
        />
      )}
    </div>
  );
}