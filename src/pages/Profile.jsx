import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, Camera, User, Heart, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DonationHistory from '@/components/donations/DonationHistory';
import VolunteerActivitySection from '@/components/profile/VolunteerActivitySection';
import UserTypeSelector, { USER_TYPES } from '@/components/profile/UserTypeSelector';
import AdopterFields from '@/components/profile/AdopterFields';
import ShelterRescueFields from '@/components/profile/ShelterRescueFields';
import ProfessionalFields from '@/components/profile/ProfessionalFields';
import { toast } from 'sonner';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [step, setStep] = useState('type'); // 'type' | 'details'
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ownedPets, setOwnedPets] = useState([]);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      setFormData(u || {});
      if (u?.user_type) setStep('details');
      if (u?.email) {
        const pets = await base44.entities.OwnedPet.filter({ owner_email: u.email }).catch(() => []);
        setOwnedPets(pets);
      }
    });
  }, []);

  const set = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const toggleFeaturedPet = (petId) => {
    const current = formData.featured_pet_ids || [];
    const updated = current.includes(petId) ? current.filter(id => id !== petId) : [...current, petId];
    set('featured_pet_ids', updated);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('avatar_url', file_url);
    setUploading(false);
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('banner_url', file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ ...formData, profile_complete: true });

      // Handle volunteer shelter notification if provided
      if (formData.volunteer_shelter) {
        try {
          const result = await base44.functions.invoke('handleVolunteerNotification', {
            volunteer_shelter: formData.volunteer_shelter
          });
          if (result.data.success && result.data.rescue_name) {
            toast.success(`Notification sent to ${result.data.rescue_name}`);
          }
        } catch (err) {
          console.error('Error sending volunteer notification:', err);
        }
      }

      window.dispatchEvent(new Event('profile-updated'));
      toast.success('Profile saved!');
      setStep('details');
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentType = USER_TYPES.find((t) => t.value === formData.user_type);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
    </div>);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Your Profile & Activity</h1>
          <p className="text-slate-500 mt-2">Update your profile and see how you've made an impact here.</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="volunteer" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Volunteer</span>
            </TabsTrigger>
            <TabsTrigger value="donations" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>Donations</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden">
          {/* Step indicator */}
          <div className="flex border-b border-slate-100">
            {['type', 'details'].map((s, i) =>
                <button
                  key={s}
                  onClick={() => formData.user_type && setStep(s)}
                  className={`flex-1 py-4 text-sm font-medium transition-colors ${
                  step === s ? "border-b-2" : 'text-slate-400 hover:text-slate-600'}`
                  }
                  style={step === s ? { borderColor: '#b1511d', color: '#b1511d' } : {}}>
                  
                {i + 1}. {s === 'type' ? 'Account Type' : 'Profile Details'}
              </button>
                )}
          </div>

          <div className="p-6 md:p-8">
            {step === 'type' &&
                <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800 mb-1">What best describes you?</h2>
                  <p className="text-sm text-slate-500 mb-5">Choose the account type that fits your role in the pet community. You can change your account type at any time.</p>
                  <UserTypeSelector value={formData.user_type} onChange={(v) => set('user_type', v)} />
                </div>
                <Button
                    onClick={() => setStep('details')}
                    disabled={!formData.user_type}
                    className="w-full h-12 rounded-xl text-base font-semibold">
                    
                  Continue →
                </Button>
              </div>
                }

            {step === 'details' &&
                <div className="space-y-6">
                {/* Type badge */}
                {currentType &&
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                     <span className="text-2xl">{currentType.emoji}</span>
                     <div>
                       <p className="text-sm font-semibold text-amber-700">{currentType.label}</p>
                       <button onClick={() => setStep('type')} className="text-xs text-amber-600 hover:underline">Change type</button>
                     </div>
                   </div>
                  }

                {/* Banner */}
                <div>
                  <Label className="mb-2 block">Profile Banner</Label>
                  <div className="relative bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 h-32 flex items-center justify-center">
                    {formData.banner_url ? (
                      <img src={formData.banner_url} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                        <p className="text-xs text-slate-500">Recommended: 1200x300px</p>
                      </div>
                    )}
                    <label className="absolute bottom-2 right-2 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors" style={{ backgroundColor: '#b1511d' }} onMouseEnter={(e) => e.target.style.opacity = '0.9'} onMouseLeave={(e) => e.target.style.opacity = '1'}>
                      {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                      <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                    </label>
                  </div>
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {formData.avatar_url ?
                      <img src={formData.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" /> :

                      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-lg">
                        <User className="w-8 h-8 text-slate-400" />
                      </div>
                      }
                    <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors" style={{ backgroundColor: '#b1511d' }} onMouseEnter={(e) => e.target.style.opacity = '0.9'} onMouseLeave={(e) => e.target.style.opacity = '1'}>
                      {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{user.full_name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                    {formData.profile_complete &&
                      <Badge className="mt-1 bg-emerald-100 text-emerald-700 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Profile complete</Badge>
                      }
                  </div>
                </div>

                {/* Common fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block">Display Name / Org Name</Label>
                    <Input value={formData.display_name || ''} onChange={(e) => set('display_name', e.target.value)} placeholder="How should we call you?" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Phone</Label>
                    <Input value={formData.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="(555) 000-0000" />
                  </div>
                </div>

                <div>
                  <Label className="mb-1.5 block">Bio / About</Label>
                  <Textarea value={formData.bio || ''} onChange={(e) => set('bio', e.target.value)} placeholder="Tell the community a bit about yourself..." className="h-20" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block">City</Label>
                    <Input value={formData.city || ''} onChange={(e) => set('city', e.target.value)} placeholder="City" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block">State</Label>
                    <Input value={formData.state || ''} onChange={(e) => set('state', e.target.value)} placeholder="State" />
                  </div>
                </div>

                <div>
                   <Label className="mb-1.5 block">Website</Label>
                   <Input value={formData.website || ''} onChange={(e) => set('website', e.target.value)} placeholder="https://yoursite.com" />
                 </div>

                 {/* Make Profile Public */}
                  <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <input
                       type="checkbox"
                       id="share_profile"
                       checked={formData.share_profile || false}
                       onChange={(e) => set('share_profile', e.target.checked)}
                       className="w-4 h-4 rounded cursor-pointer" />

                    <label htmlFor="share_profile" className="cursor-pointer flex-1">
                      <p className="text-sm font-semibold text-amber-700">Make profile public</p>
                      <p className="text-xs text-amber-600">Other users can view your profile and discover you</p>
                    </label>
                  </div>

                  {/* Profile Preview */}
                  {formData.share_profile && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-xs font-semibold text-slate-600 mb-3 uppercase">public profile preview</p>
                      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="relative">
                          {formData.banner_url ? (
                            <img src={formData.banner_url} alt="Banner" className="h-24 w-full object-cover" />
                          ) : (
                            <div className="h-24 bg-gradient-to-br from-amber-100 to-yellow-100"></div>
                          )}
                          {formData.avatar_url && (
                            <img src={formData.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full object-cover border-3 border-white absolute -bottom-6 left-4 shadow-md" />
                          )}
                        </div>
                        <div className="p-4 pt-8">
                          <h3 className="font-bold text-base mb-1">{formData.display_name || user.full_name}</h3>
                          <p className="text-xs text-slate-400 mb-3">member since {new Date().getFullYear()}</p>
                          {formData.bio && <p className="text-sm text-slate-700 mb-3 line-clamp-2">{formData.bio}</p>}
                          {(formData.city || formData.state) && (
                            <p className="text-xs text-slate-500 mb-3">📍 {formData.city}{formData.city && formData.state ? ', ' : ''}{formData.state}</p>
                          )}
                          <span className="inline-block bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">view profile</span>
                        </div>
                      </div>
                    </div>
                  )}

                 {/* Featured Pets */}
                 {ownedPets.length > 0 && (
                   <div className="pt-2 border-t border-slate-100">
                     <h3 className="text-sm font-semibold text-slate-700 mb-1">Featured Pets on Public Profile</h3>
                     <p className="text-xs text-slate-500 mb-3">Select which of your pets to show on your public profile.</p>
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                       {ownedPets.map(pet => {
                         const selected = (formData.featured_pet_ids || []).includes(pet.id);
                         return (
                           <button
                             key={pet.id}
                             type="button"
                             onClick={() => toggleFeaturedPet(pet.id)}
                             className={`flex items-center gap-2 p-2 rounded-xl border-2 text-left transition-all ${
                               selected ? 'border-[#b1511d] bg-amber-50' : 'border-slate-200 hover:border-slate-300'
                             }`}
                           >
                             {pet.photo_url ? (
                               <img src={pet.photo_url} alt={pet.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                             ) : (
                               <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-lg shrink-0">🐾</div>
                             )}
                             <div className="min-w-0">
                               <p className="text-xs font-semibold text-slate-800 truncate">{pet.name}</p>
                               <p className="text-xs text-slate-500 truncate">{pet.pet_type}</p>
                             </div>
                             {selected && <span className="ml-auto text-[#b1511d] text-xs">✓</span>}
                           </button>
                         );
                       })}
                     </div>
                   </div>
                 )}

                 {/* Type-specific fields */}
                {(formData.user_type === 'adopter' || formData.user_type === 'pet_owner') &&
                  <div className="pt-2 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4">additional information</h3>
                    <AdopterFields data={formData} onChange={set} />
                  </div>
                  }

                {(formData.user_type === 'shelter' || formData.user_type === 'rescue') &&
                  <div className="pt-2 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4">🏢 Organization Details</h3>
                    <ShelterRescueFields data={formData} onChange={set} />
                  </div>
                  }

                {(formData.user_type === 'pet_trainer' || formData.user_type === 'veterinarian' || formData.user_type === 'pet_store') &&
                  <div className="pt-2 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4">💼 Professional Details</h3>
                    <ProfessionalFields
                      data={formData}
                      onChange={set}
                      label={currentType?.label || 'professional'} />
                    
                  </div>
                  }

                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full h-12 rounded-xl text-base font-semibold">
                    
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                  Save Profile
                </Button>
              </div>
                }
          </div>
            </div>
          </TabsContent>

          <TabsContent value="volunteer">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Your Volunteer Activity</h2>
              <VolunteerActivitySection userEmail={user.email} />
            </div>
          </TabsContent>

          <TabsContent value="donations">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Your Donation History</h2>
              <DonationHistory userEmail={user.email} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>);

}