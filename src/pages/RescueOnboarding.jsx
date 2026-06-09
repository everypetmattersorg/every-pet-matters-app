import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle2, ChevronRight, Loader2, PawPrint, Plug, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const PLATFORMS = [
  { value: 'ShelterLuv', label: 'ShelterLuv', fields: ['api_key', 'organization_id'] },
  { value: 'RescueGroups', label: 'RescueGroups', fields: ['api_key'] },
  { value: 'Adopt-a-Pet', label: 'Adopt-a-Pet', fields: ['api_key', 'organization_id'] },
  { value: 'PetPoint', label: 'PetPoint', fields: ['api_key', 'organization_id'] },
  { value: 'Other', label: 'Other / Manual', fields: ['api_key'] },
];

const STEPS = [
  { id: 1, label: 'Organization', icon: Building2 },
  { id: 2, label: 'Profile', icon: PawPrint },
  { id: 3, label: 'API Connection', icon: Plug },
];

export default function RescueOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [orgForm, setOrgForm] = useState({
    org_type: 'rescue',
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
  });

  const [profileForm, setProfileForm] = useState({
    mission_statement: '',
    about: '',
    logo_url: '',
    accepts_volunteers: false,
    fosters_needed: false,
  });

  const [apiForm, setApiForm] = useState({
    software_platform: '',
    api_key: '',
    organization_id: '',
    contact_name: '',
    contact_email: '',
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (user) {
      setOrgForm((f) => ({ ...f, email: f.email || user.email || '' }));
      setApiForm((f) => ({ ...f, contact_email: f.contact_email || user.email || '', contact_name: f.contact_name || user.full_name || '' }));
    }
  }, [user]);

  const selectedPlatform = PLATFORMS.find((p) => p.value === apiForm.software_platform);

  const handleStep1 = async () => {
    if (!orgForm.name || !orgForm.email) {
      toast.error('Please fill in organization name and email');
      return;
    }
    setSaving(true);
    try {
      const existing = await base44.entities.Rescue.filter({ email: orgForm.email });
      if (existing.length > 0) {
        await base44.entities.Rescue.update(existing[0].id, orgForm);
      } else {
        await base44.entities.Rescue.create(orgForm);
      }
      if (user?.role !== 'admin') {
        await base44.auth.updateMe({ role: orgForm.org_type });
      }
      setStep(2);
    } catch (err) {
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    }
    setSaving(false);
  };

  const handleStep2 = async () => {
    setSaving(true);
    try {
      const existing = await base44.entities.Rescue.filter({ email: orgForm.email });
      if (existing.length > 0) {
        await base44.entities.Rescue.update(existing[0].id, profileForm);
      }
      setStep(3);
    } catch (err) {
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    }
    setSaving(false);
  };

  const handleStep3 = async (skip = false) => {
    if (!skip) {
      if (!apiForm.software_platform || !apiForm.api_key) {
        toast.error('Please select a platform and enter your API key');
        return;
      }
      setSaving(true);
      await base44.entities.ShelterConnection.create({
        shelter_name: orgForm.name,
        contact_name: apiForm.contact_name,
        contact_email: apiForm.contact_email,
        software_platform: apiForm.software_platform,
        api_key: apiForm.api_key,
        organization_id: apiForm.organization_id,
        status: 'pending',
      });
      setSaving(false);
    }
    // Mark onboarding complete
    await base44.auth.updateMe({ onboarding_complete: true });
    toast.success('Setup complete! Welcome to the Rescue Center.');
    navigate('/ShelterPortal');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/e47a94797_every_pet_logos__1_.png" alt="every pet" className="w-20 h-20" />
        </div>

        <h1 className="text-2xl font-black text-center mb-1">Welcome to every pet</h1>
        <p className="text-center text-muted-foreground text-sm mb-8">Let's set up your rescue or shelter profile in a few quick steps.</p>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  done ? 'bg-green-100 text-green-700' : active ? 'bg-[#b1511d] text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  {s.label}
                </div>
                {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
              </div>
            );
          })}
        </div>

        <Card>
          <CardContent className="pt-6 pb-6 space-y-4">
            {/* Step 1 */}
            {step === 1 && (
              <>
                <h2 className="font-bold text-lg">Organization Details</h2>
                <div className="space-y-1.5">
                  <Label>Type *</Label>
                  <Select value={orgForm.org_type} onValueChange={(v) => setOrgForm((f) => ({ ...f, org_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rescue">Rescue Organization</SelectItem>
                      <SelectItem value="shelter">Animal Shelter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Organization Name *</Label>
                  <Input placeholder="e.g. Happy Paws Rescue" value={orgForm.name} onChange={(e) => setOrgForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Email *</Label>
                  <Input type="email" value={orgForm.email} onChange={(e) => setOrgForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input placeholder="(555) 000-0000" value={orgForm.phone} onChange={(e) => setOrgForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Website</Label>
                    <Input placeholder="https://..." value={orgForm.website} onChange={(e) => setOrgForm((f) => ({ ...f, website: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Address</Label>
                  <Input placeholder="City, State" value={orgForm.address} onChange={(e) => setOrgForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
                <Button className="w-full gap-2" style={{ backgroundColor: '#b1511d', color: 'white' }} onClick={handleStep1} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Continue
                </Button>
              </>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <>
                <h2 className="font-bold text-lg">Public Profile</h2>
                <p className="text-sm text-muted-foreground">This appears in the shelter directory and on your rescue page.</p>
                <div className="space-y-1.5">
                  <Label>Mission Statement</Label>
                  <Input placeholder="One sentence about your mission..." value={profileForm.mission_statement} onChange={(e) => setProfileForm((f) => ({ ...f, mission_statement: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>About / Description</Label>
                  <Textarea rows={4} placeholder="Tell adopters about your organization..." value={profileForm.about} onChange={(e) => setProfileForm((f) => ({ ...f, about: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Logo URL</Label>
                  <Input placeholder="https://..." value={profileForm.logo_url} onChange={(e) => setProfileForm((f) => ({ ...f, logo_url: e.target.value }))} />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button className="flex-1 gap-2" style={{ backgroundColor: '#b1511d', color: 'white' }} onClick={handleStep2} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Continue
                  </Button>
                </div>
              </>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <>
                <h2 className="font-bold text-lg">API Connection</h2>
                <p className="text-sm text-muted-foreground">Connect your shelter management software to auto-sync your pets. You can skip this and add it later.</p>
                <div className="space-y-1.5">
                  <Label>Platform</Label>
                  <Select value={apiForm.software_platform} onValueChange={(v) => setApiForm((f) => ({ ...f, software_platform: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select your software..." /></SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {selectedPlatform && (
                  <>
                    <div className="space-y-1.5">
                      <Label>API Key *</Label>
                      <Input placeholder="Paste your API key" value={apiForm.api_key} onChange={(e) => setApiForm((f) => ({ ...f, api_key: e.target.value }))} />
                    </div>
                    {selectedPlatform.fields.includes('organization_id') && (
                      <div className="space-y-1.5">
                        <Label>Organization / Shelter ID</Label>
                        <Input value={apiForm.organization_id} onChange={(e) => setApiForm((f) => ({ ...f, organization_id: e.target.value }))} />
                      </div>
                    )}
                  </>
                )}
                <div className="flex flex-col gap-2 pt-2">
                  <Button className="w-full gap-2" style={{ backgroundColor: '#b1511d', color: 'white' }} onClick={() => handleStep3(false)} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Connect &amp; Finish
                  </Button>
                  <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => handleStep3(true)}>
                    Skip for now — I'll add this later
                  </Button>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-xs text-muted-foreground px-0">← Back</Button>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Already set up? <Link to="/ShelterPortal" className="underline">Go to Rescue Center</Link>
        </p>
      </div>
    </div>
  );
}