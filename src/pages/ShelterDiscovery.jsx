import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Search, Loader2, Mail, Building2, UserCheck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  active: { label: 'Partner', color: 'bg-green-100 text-green-800', icon: UserCheck },
};

export default function ShelterDiscovery() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: myConnections = [] } = useQuery({
    queryKey: ['my-connections', user?.email],
    queryFn: () => base44.entities.ShelterConnection.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const { data: allConnections = [] } = useQuery({
    queryKey: ['all-connections'],
    queryFn: () => base44.entities.ShelterConnection.list('-created_date', 500),
  });

  const { data: partnerships = [], refetch: refetchPartnerships } = useQuery({
    queryKey: ['partnerships', user?.email],
    queryFn: () => base44.entities.ShelterPartnership.filter({ initiator_email: user?.email }),
    enabled: !!user?.email,
  });

  const myConnectionIds = new Set(myConnections.map(c => c.id));
  const partneredIds = new Set(partnerships.map(p => p.partner_shelter_id));

  const filteredShelters = allConnections.filter(shelter => {
    if (myConnectionIds.has(shelter.id)) return false;
    if (partneredIds.has(shelter.id)) return false;
    return shelter.shelter_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSendRequest = async () => {
    if (!selectedPartner) return;
    setSending(true);
    try {
      await base44.entities.ShelterPartnership.create({
        initiator_shelter_id: myConnections[0]?.id,
        initiator_shelter_name: myConnections[0]?.shelter_name,
        initiator_email: user?.email,
        partner_shelter_id: selectedPartner.id,
        partner_shelter_name: selectedPartner.shelter_name,
        partner_email: selectedPartner.contact_email,
        status: 'pending',
        notes,
      });
      toast.success(`Partnership request sent to ${selectedPartner.shelter_name}!`);
      setSelectedPartner(null);
      setNotes('');
      refetchPartnerships();
    } catch (err) {
      toast.error('Failed to send partnership request');
    }
    setSending(false);
  };

  if (!user) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link to="/ShelterPortal">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">🤝 Shelter Discovery</h1>
            <p className="text-xs text-muted-foreground">Find and partner with other shelters</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {myConnections.length === 0 ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <p className="text-sm text-amber-900">You need to connect a shelter first to discover partners. Go to the Shelter Portal to add a connection.</p>
              <Link to="/ShelterPortal" className="mt-3 inline-block">
                <Button size="sm" className="gap-2 mt-3">
                  <Building2 className="w-4 h-4" /> Go to Shelter Portal
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Search Shelters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by shelter name..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {filteredShelters.length} shelter{filteredShelters.length !== 1 ? 's' : ''} found
                </p>
              </CardContent>
            </Card>

            {filteredShelters.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No shelters match your search or all available shelters are already connected.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredShelters.map(shelter => (
                  <Card key={shelter.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">{shelter.shelter_name}</h3>
                        <p className="text-xs text-muted-foreground">{shelter.software_platform}</p>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {shelter.contact_name && <p>👤 {shelter.contact_name}</p>}
                        {shelter.contact_email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {shelter.contact_email}</p>}
                        {shelter.organization_id && <p className="flex items-center gap-1"><Building2 className="w-3 h-3" /> ID: {shelter.organization_id}</p>}
                      </div>
                      {shelter.notes && <p className="text-xs bg-muted p-2 rounded">{shelter.notes}</p>}
                      <Button
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => setSelectedPartner(shelter)}
                      >
                        <UserCheck className="w-4 h-4" /> Send Partnership Request
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {partnerships.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">My Partnerships ({partnerships.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {partnerships.map(p => {
                    const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                    const Icon = cfg.icon;
                    return (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{p.partner_shelter_name}</p>
                          <p className="text-xs text-muted-foreground">{p.partner_email}</p>
                        </div>
                        <Badge className={`${cfg.color} flex items-center gap-1`}>
                          <Icon className="w-3 h-3" /> {cfg.label}
                        </Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {selectedPartner && (
        <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Partnership Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-muted">
                <p className="font-semibold text-sm">{selectedPartner.shelter_name}</p>
                <p className="text-xs text-muted-foreground mt-1">{selectedPartner.contact_email}</p>
              </div>
              <div className="space-y-2">
                <Label>Message (optional)</Label>
                <Textarea
                  placeholder="Tell them why you'd like to partner..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSendRequest} disabled={sending} className="flex-1">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
                  Send Request
                </Button>
                <Button variant="outline" onClick={() => setSelectedPartner(null)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}