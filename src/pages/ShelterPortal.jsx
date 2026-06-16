import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Plus, RefreshCw, Trash2, CheckCircle2, AlertCircle, Clock, Wifi, WifiOff, ExternalLink, LayoutDashboard, ArrowLeft, Pencil, Loader2, PawPrint, HelpCircle, Activity, ChevronDown, ChevronUp, Users, Zap, Upload, Bell, UserPlus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import ShelterStatsPanel from '@/components/shelter/ShelterStatsPanel';
import ShelterDetailsManager from '@/components/shelter/ShelterDetailsManager';
import RescueAIAssistantChat from '@/components/rescue/RescueAIAssistantChat';
import PerformanceMetrics from '@/components/dashboard/PerformanceMetrics';
import UrgentPetsSection from '@/components/dashboard/UrgentPetsSection';
import AdoptionChart from '@/components/dashboard/AdoptionChart';
import EventAttendanceChart from '@/components/dashboard/EventAttendanceChart';
import EngagementOverview from '@/components/dashboard/EngagementOverview';
import VolunteerMetrics from '@/components/dashboard/VolunteerMetrics';
import EnhancedApplicationsTab from '@/components/dashboard/EnhancedApplicationsTab';
import DonationGoalsTab from '@/components/dashboard/DonationGoalsTab';
import DonationReportTab from '@/components/donations/DonationReportTab';
import RescueMatchesTab from '@/components/dashboard/RescueMatchesTab';
import FosterApplicationsTab from '@/components/dashboard/FosterApplicationsTab';
import EditRescueProfileForm from '@/components/rescue/EditRescueProfileForm';
import APIIntegrationSettings from '@/components/rescue/APIIntegrationSettings';
import FocalPointPicker from '@/components/pets/FocalPointPicker';

const PLATFORMS = [
{ value: 'ShelterLuv', label: 'ShelterLuv', description: 'shelterluv.com API', fields: ['api_key', 'organization_id'], docsUrl: 'https://help.shelterluv.com/article/48-how-to-find-your-api-key', docsLabel: 'How to find your ShelterLuv API key' },
{ value: 'RescueGroups', label: 'RescueGroups', description: 'rescuegroups.org API', fields: ['api_key'], docsUrl: 'https://userguide.rescuegroups.org/display/APIDG/API+Key', docsLabel: 'How to get your RescueGroups API key' },
{ value: 'Adopt-a-Pet', label: 'Adopt-a-Pet', description: 'adoptapet.com API', fields: ['api_key', 'organization_id'], docsUrl: 'https://www.adoptapet.com/public/apis/pet_list.html', docsLabel: 'Adopt-a-Pet API documentation' },
{ value: 'PetPoint', label: 'PetPoint', description: 'petpoint.com API', fields: ['api_key', 'organization_id'], docsUrl: 'https://www.petpoint.com/support', docsLabel: 'Contact PetPoint support for API access' },
{ value: 'Other', label: 'Other / Manual', description: 'Manual data entry or custom API', fields: ['api_key'], docsUrl: null, docsLabel: null }];


const STATUS_CONFIG = {
  pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  active: { label: 'Connected', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  error: { label: 'Error', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  disconnected: { label: 'Disconnected', color: 'bg-gray-100 text-gray-600', icon: WifiOff }
};

const EMPTY_FORM = {
  shelter_name: '', contact_name: '', contact_email: '', contact_phone: '',
  software_platform: '', api_key: '', api_secret: '', organization_id: '', notes: ''
};

const AGE_OPTIONS = ['Baby', 'Young', 'Adult', 'Senior'];
const GENDER_OPTIONS = ['Male', 'Female', 'Unknown'];
const SIZE_OPTIONS = ['Small', 'Medium', 'Large', 'Extra Large'];

function EditPetModal({ pet, open, onClose, onSaved }) {
  const [form, setForm] = useState({ ...pet });
  const [saving, setSaving] = useState(false);
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Pet.update(pet.id, form);
    toast.success('Pet updated!');
    onSaved();
    onClose();
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit {pet.name}</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Name</Label><Input value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Species</Label><Input value={form.species || ''} onChange={(e) => set('species', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Breed</Label><Input value={form.breed || ''} onChange={(e) => set('breed', e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Age</Label>
              <Select value={form.age || ''} onValueChange={(v) => set('age', v)}>
                <SelectTrigger><SelectValue placeholder="Select age" /></SelectTrigger>
                <SelectContent>{AGE_OPTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={form.gender || ''} onValueChange={(v) => set('gender', v)}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>{GENDER_OPTIONS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Size</Label>
              <Select value={form.size || ''} onValueChange={(v) => set('size', v)}>
                <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                <SelectContent>{SIZE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Weight (lbs)</Label><Input type="number" value={form.weight || ''} onChange={(e) => set('weight', parseFloat(e.target.value) || null)} /></div>
            <div className="space-y-1.5"><Label>Location</Label><Input value={form.location || ''} onChange={(e) => set('location', e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea rows={3} value={form.description || ''} onChange={(e) => set('description', e.target.value)} /></div>

          {/* Photos & Focal Points */}
          <div className="space-y-1.5">
            <Label>Photos &amp; Focal Points</Label>
            <p className="text-xs text-muted-foreground">Hover a photo and click ✛ to adjust where it's focused when cropped.</p>
            <FocalPointPicker
              photoUrls={form.photo_urls || (form.photo_url ? [form.photo_url] : [])}
              focalPoints={form.photo_focal_points || []}
              onChange={({ photo_urls, photo_focal_points }) => {
                setForm((f) => ({ ...f, photo_urls, photo_focal_points, photo_url: photo_urls[0] || f.photo_url }));
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[{ key: 'vaccinated', label: 'Vaccinated' }, { key: 'spayed_neutered', label: 'Spayed/Neutered' }, { key: 'dewormed', label: 'Dewormed' }, { key: 'transfer_needed', label: 'Transfer Needed' }, { key: 'rescue_needed', label: 'Rescue Needed' }, { key: 'urgent', label: 'Urgent' }].map(({ key, label }) =>
            <div key={key} className="flex items-center gap-2">
                <Switch checked={!!form[key]} onCheckedChange={(v) => set(key, v)} />
                <Label>{label}</Label>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>);

}

function ShelterPetCard({ pet, onEdit }) {
  return (
    <Card className="overflow-hidden flex flex-col">
      {pet.photo_url ?
      <img src={pet.photo_url} alt={pet.name} className="w-full h-36 object-cover" referrerPolicy="no-referrer" onError={(e) => {e.target.style.display = 'none';e.target.nextSibling.style.display = 'flex';}} /> :
      null}
      <div className="w-full h-36 bg-muted items-center justify-center text-3xl" style={{ display: pet.photo_url ? 'none' : 'flex' }}>🐾</div>
      <CardContent className="pt-3 pb-4 flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm leading-tight">{pet.name}</p>
          <Button size="sm" variant="outline" className="gap-1 shrink-0 text-xs h-7 px-2" onClick={() => onEdit(pet)}>
            <Pencil className="w-3 h-3" /> Edit
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {pet.species && <span>{pet.species}</span>}
          {pet.breed && <span className="truncate">{pet.breed}</span>}
          {pet.age && <span>{pet.age}</span>}
          {pet.gender && <span>{pet.gender}</span>}
          {pet.location && <span className="truncate col-span-2">{pet.location}</span>}
        </div>
        <div className="flex flex-wrap gap-1 mt-auto pt-1">
          {pet.urgent && <Badge className="bg-red-100 text-red-700 text-xs">Urgent</Badge>}
          {pet.rescue_needed && <Badge className="bg-orange-100 text-orange-700 text-xs">Rescue Needed</Badge>}
          {pet.transfer_needed && <Badge className="bg-blue-100 text-blue-700 text-xs">Transfer</Badge>}
          {pet.vaccinated && <Badge className="bg-green-100 text-green-700 text-xs">Vaccinated</Badge>}
          {pet.spayed_neutered && <Badge className="bg-green-100 text-green-700 text-xs">Spayed/Neutered</Badge>}
        </div>
      </CardContent>
    </Card>);

}

export default function ShelterPortal() {
  // Profile tab state
  const [profileForm, setProfileForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [showConnectSection, setShowConnectSection] = useState(true);
  const [showDetailsSection, setShowDetailsSection] = useState(false);
  const [showDetailsManager, setShowDetailsManager] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingPet, setEditingPet] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    onSuccess: (u) => setProfileForm({
      full_name: u.full_name || '',
      email: u.email || '',
      title: u.title || '',
      phone: u.phone || '',
      photo_url: u.photo_url || '',
      affiliated_organization: u.affiliated_organization || '',
      bio: u.bio || ''
    })
  });

  // Sync profileForm when user loads
  const profileFormFilled = Object.keys(profileForm).length > 0;
  if (user && !profileFormFilled) {
    setProfileForm({
      full_name: user.full_name || '',
      email: user.email || '',
      title: user.title || '',
      phone: user.phone || '',
      photo_url: user.photo_url || '',
      affiliated_organization: user.affiliated_organization || '',
      bio: user.bio || ''
    });
  }

  const { data: userPrefs } = useQuery({
    queryKey: ['user-notification-prefs', user?.email],
    queryFn: () => base44.entities.NotificationPreference.filter({ user_email: user?.email }),
    enabled: !!user?.email,
    onSuccess: (prefs) => {if (prefs?.length > 0) setNotificationsEnabled(prefs[0].notifications_enabled ?? true);}
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setProfileForm((f) => ({ ...f, photo_url: file_url }));
    setUploading(false);
  };

  const handleNotificationToggle = async (enabled) => {
    setNotificationsEnabled(enabled);
    if (userPrefs?.length > 0) {
      await base44.entities.NotificationPreference.update(userPrefs[0].id, { notifications_enabled: enabled });
    } else {
      await base44.entities.NotificationPreference.create({ user_email: user.email, notifications_enabled: enabled });
    }
    toast.success(enabled ? 'Notifications enabled!' : 'Notifications disabled');
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    await base44.users.inviteUser(inviteEmail, 'user');
    toast.success(`Invitation sent to ${inviteEmail}!`);
    setInviteEmail('');
    setInviting(false);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.auth.updateMe({
      title: profileForm.title,
      phone: profileForm.phone,
      photo_url: profileForm.photo_url,
      affiliated_organization: profileForm.affiliated_organization,
      bio: profileForm.bio
    });
    toast.success('Profile updated successfully!');
    setSaving(false);
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    if (!newEmail || newEmail === user?.email) {
      toast.error('Please enter a different email address');
      return;
    }
    setUpdatingEmail(true);
    try {
      await base44.auth.updateEmail(newEmail);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setNewEmail('');
      toast.success('Email updated successfully! Please check your new email to confirm.');
    } catch (err) {
      toast.error(err.message || 'Failed to update email');
    } finally {
      setUpdatingEmail(false);
    }
  };

  const { data: rescueProfile = [] } = useQuery({
    queryKey: ['my-rescue-profile', user?.email],
    queryFn: () => base44.entities.Rescue.filter({ email: user?.email }),
    enabled: !!user?.email,
  });

  const showOnboardingBanner = user && !user.onboarding_complete && rescueProfile.length === 0;

  const { data: connections = [], isLoading, refetch } = useQuery({
    queryKey: ['shelter-connections'],
    queryFn: () => base44.entities.ShelterConnection.list('-created_date', 100)
  });

  const shelterNames = connections.map((c) => c.shelter_name);

  const { data: allPets = [], isLoading: petsLoading, refetch: refetchPets } = useQuery({
    queryKey: ['shelter-portal-pets', shelterNames.join(',')],
    queryFn: () => base44.entities.Pet.list('-created_date', 500),
    enabled: connections.length > 0
  });

  const myPets = allPets.filter((pet) =>
  shelterNames.some((name) =>
  pet.source?.toLowerCase().includes(name.toLowerCase()) ||
  name.toLowerCase().includes(pet.source?.toLowerCase() || '')
  )
  );

  const { data: adoptablePets = [] } = useQuery({
    queryKey: ['adoptable-pets', user?.email],
    queryFn: () => base44.entities.AdoptablePet.filter({ rescue_email: user?.email }, '-created_date', 100),
    enabled: !!user?.email
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events', user?.email],
    queryFn: () => base44.entities.RescueEvent.filter({ rescue_email: user?.email }, '-event_date', 50),
    enabled: !!user?.email
  });

  const { data: rsvps = [] } = useQuery({
    queryKey: ['rsvps'],
    queryFn: () => base44.entities.EventRSVP.list(),
    enabled: !!user?.email
  });

  const { data: volunteers = [] } = useQuery({
    queryKey: ['volunteers', user?.email],
    queryFn: () => base44.entities.VolunteerInterest.filter({ rescue_email: user?.email }, '-created_date', 100),
    enabled: !!user?.email
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', user?.email],
    queryFn: () => base44.entities.RescueReview.filter({ rescue_email: user?.email }, '-created_date', 100),
    enabled: !!user?.email
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['applications', user?.email],
    queryFn: () => base44.entities.AdoptionApplication.filter({ rescue_email: user?.email }, '-created_date', 200),
    enabled: !!user?.email
  });

  const selectedPlatform = PLATFORMS.find((p) => p.value === form.software_platform);

  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(null);

  const handleForceSync = async (conn) => {
    setSyncing(conn.id);
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
        const data = text ? JSON.parse(text) : {};
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}: ${text.slice(0, 200)}`);
        toast.success(`Synced ${data.animals_synced ?? 0} animals for ${conn.shelter_name}!`);
      } else {
        toast.info(`Sync for ${conn.software_platform} is not yet supported.`);
      }
      refetch();
      refetchPets();
    } catch (err) {
      toast.error('Sync failed: ' + err.message);
    } finally {
      setSyncing(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.shelter_name || !form.software_platform || !form.contact_email) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.ShelterConnection.create({ ...form, status: 'pending' });
      toast.success("Connection request submitted! We'll review and activate it shortly.");
      setForm(EMPTY_FORM);
      setShowForm(false);
      refetch();
    } catch (err) {
      toast.error('Failed to submit connection: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.ShelterConnection.delete(id);
      toast.success('Connection removed');
      refetch();
    } catch (err) {
      toast.error('Failed to delete connection: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Link to="/PetDashboard">
              <Button variant="ghost" className="text-white px-3 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center whitespace-nowrap transition-colors hover:bg-[#a03f17] h-9 gap-2 shrink-0 bg-[#af501d]">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">search rescue partners</span>
              </Button>
            </Link>
            <h1 className="text-base sm:text-xl font-bold">rescue center</h1>
            <div className="flex items-center gap-1">
              <Link to="/ShelterDashboard">
                <Button variant="outline" size="sm" className="gap-1 px-2">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">My Pets</span>
                </Button>
              </Link>
              <Link to="/ShelterDirectory">
                <Button variant="outline" size="sm" className="gap-1 px-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">directory</span>
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-muted-foreground text-xs text-center hidden sm:block">Connect your shelter software to sync pets automatically &amp; see the pets associated with your shelter or rescue.</p>
        </div>
      </div>

      {showOnboardingBanner && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <span className="text-lg">👋</span>
              <span><strong>Welcome!</strong> Complete your rescue profile to get started — it only takes 2 minutes.</span>
            </div>
            <Button
              size="sm"
              style={{ backgroundColor: '#b1511d', color: 'white' }}
              className="shrink-0"
              onClick={() => {
                setShowDetailsSection(true);
                setShowConnectSection(true);
                setTimeout(() => document.querySelector('[data-radix-collection-item][value="manage"]')?.click(), 50);
                setTimeout(() => document.querySelector('.border.rounded-xl')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
              }}
            >
              Complete Setup →
            </Button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Tabs Navigation */}
        <Tabs defaultValue="manage" className="mb-8">
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <TabsList className="flex w-max sm:w-full gap-1 p-1.5 rounded-lg bg-[hsl(var(--background))] [&>button[data-state=active]]:bg-[#b1511d] [&>button[data-state=active]]:text-white [&>button]:hover:bg-slate-100 [&>button[data-state=active]]:hover:bg-[#a03f17]">
              <TabsTrigger value="manage" className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm">Manage</TabsTrigger>
              <TabsTrigger value="analytics" className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm">Analytics</TabsTrigger>
              <TabsTrigger value="applications" className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm">Applications</TabsTrigger>
              <TabsTrigger value="campaigns" className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm">Campaigns</TabsTrigger>
              <TabsTrigger value="donations" className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm">Reports</TabsTrigger>
              <TabsTrigger value="matches" className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm">Potential</TabsTrigger>
              <TabsTrigger value="foster" className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm">Fosters</TabsTrigger>
              <TabsTrigger value="ai-assistant" className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm">assistant</TabsTrigger>
              <TabsTrigger value="profile" className="px-3 py-2 whitespace-nowrap text-xs sm:text-sm">My Profile</TabsTrigger>
            </TabsList>
          </div>

          {/* assistant Tab */}
          <TabsContent value="ai-assistant" className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">💡 What I can help with:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✨ Generate compelling pet descriptions to attract adopters</li>
                <li>📱 Draft engaging social media posts about adoptions and events</li>
                <li>💑 Suggest potential matches between pets and adoption applicants</li>
              </ul>
            </div>

            <RescueAIAssistantChat rescueEmail={user?.email} />
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-8">
            {/* Shelter Details Manager Toggle */}
          <div className="border rounded-xl bg-white shadow-sm overflow-hidden mt-8">
          <button
                onClick={() => setShowDetailsSection(!showDetailsSection)}
                className="w-full flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              <PawPrint className="w-4 h-4" style={{ color: '#708238' }} />
              <span className="font-semibold text-sm">Create or Edit Shelter or Rescue Profile</span>
            </div>
            {showDetailsSection ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showDetailsSection &&
              <div className="px-5 pb-5 border-t pt-4">
              <p className="text-sm text-muted-foreground mb-3">Create a public profile for your shelter or rescue organization that will appear in the Shelter Directory.</p>
              <Button onClick={() => setShowDetailsManager(true)} variant="outline" size="sm" className="gap-2" style={{ backgroundColor: '#b1511d', color: 'white', borderColor: '#b1511d' }}>
                <Plus className="w-4 h-4" />
                Create or Edit Profile
              </Button>
            </div>
              }
        </div>

        {/* Add Connection Toggle Section */}
        <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
          <button
                onClick={() => setShowConnectSection((s) => !s)}
                className="w-full flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" style={{ color: '#708238' }} />
              <span className="font-semibold text-sm">Add a Shelter API Connection</span>
            </div>
            {showConnectSection ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showConnectSection && !showForm &&
              <div className="px-5 pb-5 space-y-4 border-t">
              <div className="pt-4 flex items-center justify-end gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 text-sm">Check your software sync for errors here.</PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {PLATFORMS.filter((p) => p.value !== 'Other').map((p) =>
                  <Card key={p.value} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {setForm({ ...EMPTY_FORM, software_platform: p.value });setShowForm(true);}}>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">🔌</div>
                        <div>
                          <p className="font-semibold text-sm">{p.label}</p>
                          <p className="text-xs text-muted-foreground">{p.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  )}
              </div>
            </div>
              }
          {showConnectSection && showForm &&
              <div className="px-5 pb-5 border-t pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Connect {selectedPlatform?.label}</h3>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>← Back</Button>
                </div>
                {selectedPlatform?.docsUrl &&
                  <a href={selectedPlatform.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> {selectedPlatform.docsLabel}
                  </a>
                  }
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Shelter / Rescue Name *</Label>
                    <Input value={form.shelter_name} onChange={(e) => setForm((f) => ({ ...f, shelter_name: e.target.value }))} placeholder="e.g. Happy Paws Rescue" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact Name</Label>
                    <Input value={form.contact_name} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact Email *</Label>
                    <Input type="email" value={form.contact_email} onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact Phone</Label>
                    <Input value={form.contact_phone} onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))} />
                  </div>
                  {selectedPlatform?.fields.includes('api_key') &&
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>API Key *</Label>
                      <Input value={form.api_key} onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))} placeholder="Paste your API key here" />
                    </div>
                    }
                  {selectedPlatform?.fields.includes('organization_id') &&
                    <div className="space-y-1.5">
                      <Label>Organization / Shelter ID</Label>
                      <Input value={form.organization_id} onChange={(e) => setForm((f) => ({ ...f, organization_id: e.target.value }))} />
                    </div>
                    }
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Notes (optional)</Label>
                    <Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any additional info..." />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={submitting} style={{ backgroundColor: '#b1511d', color: 'white' }}>
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</> : 'Submit Connection Request'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </div>
              }
        </div>

        {/* Existing Connections */}
        {connections.length > 0 &&
            <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Active Connections ({connections.length})</h2>
              <Button variant="ghost" size="sm" onClick={refetch} className="gap-1">
                <RefreshCw className="w-3 h-3" /> Refresh
              </Button>
            </div>
            <div className="space-y-3">
              {connections.map((conn) => {
                  const statusCfg = STATUS_CONFIG[conn.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusCfg.icon;
                  return (
                    <Card key={conn.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg shrink-0">🏠</div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold">{conn.shelter_name}</p>
                              <Badge className={`${statusCfg.color} text-xs flex items-center gap-1`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusCfg.label}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><Wifi className="w-3 h-3" /> {conn.software_platform}</span>
                              {conn.contact_email && <span>📧 {conn.contact_email}</span>}
                              {conn.pets_synced != null && <span>🐾 {conn.pets_synced} pets synced</span>}
                              {conn.last_sync && <span>🕐 Last sync: {new Date(conn.last_sync).toLocaleDateString()}</span>}
                            </div>
                            {conn.status === 'pending' &&
                              <p className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                                ⏳ Your connection is under review. We'll activate it shortly.
                              </p>
                              }
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs"
                            disabled={syncing === conn.id || conn.status === 'pending'}
                            onClick={() => handleForceSync(conn)}
                          >
                            {syncing === conn.id
                              ? <><Loader2 className="w-3 h-3 animate-spin" /> Syncing...</>
                              : <><RefreshCw className="w-3 h-3" /> Force Sync</>
                            }
                          </Button>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleDelete(conn.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>);

                })}
            </div>
          </div>
            }

        {/* Shelter Analytics */}
        {myPets.length > 0 && <ShelterStatsPanel pets={myPets} />}

        {/* My Pets Section */}
        {connections.length > 0 &&
            <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">🐾 My Pets</h2>
                <p className="text-xs text-muted-foreground">Pets synced from your connected shelters</p>
              </div>
              <div className="flex items-center gap-2">
                {myPets.length > 0 && <Badge variant="secondary">{myPets.length} pet{myPets.length !== 1 ? 's' : ''}</Badge>}
                <Button variant="ghost" size="sm" onClick={refetchPets} className="gap-1">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </Button>
              </div>
            </div>

            {petsLoading ?
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div> :
              myPets.length === 0 ?
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <PawPrint className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">No pets synced yet. Pets from your connected shelters will appear here once synced.</p>
              </div> :

              connections.map((conn) => {
                const connPets = myPets.filter((pet) =>
                pet.source?.toLowerCase().includes(conn.shelter_name.toLowerCase()) ||
                conn.shelter_name.toLowerCase().includes(pet.source?.toLowerCase() || '')
                );
                if (connPets.length === 0) return null;
                return (
                  <div key={conn.id} className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-sm">🏠</div>
                      <div>
                        <h3 className="font-semibold text-sm">{conn.shelter_name}</h3>
                        <p className="text-xs text-muted-foreground">{conn.software_platform} · {connPets.length} pets</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {connPets.map((pet) => <ShelterPetCard key={pet.id} pet={pet} onEdit={setEditingPet} />)}
                    </div>
                  </div>);

              })
              }
            </div>
            }
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-8">
            {/* Performance Metrics */}
            <PerformanceMetrics
              pets={adoptablePets}
              applications={applications}
              events={events}
              reviews={reviews} />
            

            {/* Urgent Pets Section */}
            <UrgentPetsSection pets={adoptablePets} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdoptionChart pets={adoptablePets} />
              <EventAttendanceChart events={events} rsvps={rsvps} />
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VolunteerMetrics volunteers={volunteers} />
              <EngagementOverview pets={adoptablePets} events={events} volunteers={volunteers} reviews={reviews} />
            </div>
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications" className="space-y-8">
            <EnhancedApplicationsTab rescueEmail={user?.email} />
            </TabsContent>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-8">
            <DonationGoalsTab rescueEmail={user?.email} />
            </TabsContent>

            {/* Donations Tab */}
            <TabsContent value="donations" className="space-y-8">
            <DonationReportTab rescueEmail={user?.email} />
            </TabsContent>

            {/* Matches Tab */}
            <TabsContent value="matches" className="space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <RescueMatchesTab rescueEmail={user?.email} />
            </div>
            </TabsContent>

            {/* Foster Tab */}
            <TabsContent value="foster" className="space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <FosterApplicationsTab rescueEmail={user?.email} currentUser={user} />
            </div>
            </TabsContent>

            {/* My Profile Tab */}
            <TabsContent value="profile" className="space-y-8">
              {user &&
            <div className="max-w-2xl mx-auto">
                  <form onSubmit={handleProfileSave} className="space-y-6">
                    {/* Avatar */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-6">
                          <Avatar className="w-20 h-20">
                            <AvatarImage src={profileForm.photo_url} />
                            <AvatarFallback className="text-2xl bg-primary/10">
                              {user.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <h2 className="text-xl font-bold">rescue center contact profile</h2>
                            <p className="font-semibold text-lg">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <label className="cursor-pointer">
                              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                              <Button type="button" variant="outline" size="sm" className="gap-2 mt-1" disabled={uploading} asChild>
                                <span>
                                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                  {uploading ? 'Uploading...' : 'Upload Photo'}
                                </span>
                              </Button>
                            </label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Basic Info */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Basic Information</CardTitle>
                        <CardDescription>Your name and email are managed by the platform and cannot be changed here.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input value={profileForm.full_name || ''} disabled className="bg-muted/50" />
                          </div>
                          <div className="space-y-2">
                            <Label>Current Email</Label>
                            <Input value={user?.email || ''} disabled className="bg-muted/50" />
                          </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                          <p className="text-sm font-semibold">Update Email Address</p>
                          <form onSubmit={handleUpdateEmail} className="space-y-3">
                            <div>
                              <Label htmlFor="new-email" className="text-sm">New Email Address</Label>
                              <Input
                            id="new-email"
                            type="email"
                            placeholder="newemail@example.com"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)} />
                          
                            </div>
                            <Button type="submit" variant="outline" disabled={updatingEmail || !newEmail} className="w-full gap-2" style={updatingEmail || !newEmail ? {} : { backgroundColor: '#b1511d', color: 'white', borderColor: '#b1511d' }}>
                              {updatingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : ''}
                              {updatingEmail ? 'Updating...' : 'Update Email'}
                            </Button>
                          </form>
                        </div>
                        <div className="space-y-2">
                           <Label>Title / Role</Label>
                           <Input placeholder="e.g. Rescue Coordinator, Volunteer" value={profileForm.title || ''} onChange={(e) => setProfileForm((f) => ({ ...f, title: e.target.value }))} />
                         </div>
                         <div className="space-y-2">
                           <Label>Contact Phone</Label>
                           <Input placeholder="(555) 000-0000" value={profileForm.phone || ''} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} />
                         </div>
                         <div className="space-y-2">
                           <Label>Affiliated Organization</Label>
                           <Input placeholder="e.g. Happy Paws Rescue" value={profileForm.affiliated_organization || ''} onChange={(e) => setProfileForm((f) => ({ ...f, affiliated_organization: e.target.value }))} />
                         </div>
                         <div className="space-y-2">
                           <Label>Bio</Label>
                           <Textarea placeholder="A short bio about yourself..." value={profileForm.bio || ''} rows={3} onChange={(e) => setProfileForm((f) => ({ ...f, bio: e.target.value }))} />
                         </div>
                      </CardContent>
                    </Card>

                    {/* Notifications */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" /> Email Notifications</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Pet Match Alerts</p>
                            <p className="text-xs text-muted-foreground">Get emailed when a pet matching your saved preferences is uploaded</p>
                          </div>
                          <Switch checked={notificationsEnabled} onCheckedChange={handleNotificationToggle} />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Invite */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2"><UserPlus className="w-4 h-4" /> Invite Someone</CardTitle>
                        <CardDescription>Invite a colleague or fellow rescuer to join the platform.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Input type="email" placeholder="their@email.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleInvite(e)} className="flex-1" />
                          <Button type="button" variant="outline" disabled={inviting || !inviteEmail} onClick={handleInvite} className="gap-2 shrink-0">
                            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            {inviting ? 'Sending...' : 'Invite'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Button type="submit" className="w-full" disabled={saving} style={{ backgroundColor: '#b1511d', color: 'white' }}>
                      {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Save Profile'}
                    </Button>
                  </form>
                </div>
            }
            </TabsContent>
            </Tabs>
            </div>

            {editingPet &&
      <EditPetModal
        pet={editingPet}
        open={!!editingPet}
        onClose={() => setEditingPet(null)}
        onSaved={() => {refetchPets();setEditingPet(null);}} />

      }

      <ShelterDetailsManager
        open={showDetailsManager}
        onClose={() => setShowDetailsManager(false)}
        onSaved={() => refetch()} />
      
    </div>);

}