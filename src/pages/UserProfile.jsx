import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Bell, UserPlus, Heart, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import ResourceStatusView from '@/components/resources/ResourceStatusView';
import PreferencesForm from '@/components/preferences/PreferencesForm';
import CloakedEmailManager from '@/components/preferences/CloakedEmailManager';
import { createPageUrl } from '@/utils';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [sentInvites, setSentInvites] = useState([]);

  const { data: userPrefs } = useQuery({
    queryKey: ['user-notification-prefs', user?.email],
    queryFn: () => base44.entities.NotificationPreference.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (userPrefs?.length > 0) {
      setNotificationsEnabled(userPrefs[0].notifications_enabled ?? true);
    }
  }, [userPrefs]);

  useEffect(() => {
    base44.auth.me().then(async u => {
      setUser(u);
      setForm({
        full_name: u.full_name || '',
        email: u.email || '',
        title: u.title || '',
        phone: u.phone || '',
        photo_url: u.photo_url || '',
        affiliated_organization: u.affiliated_organization || '',
        organization_address: u.organization_address || '',
        bio: u.bio || '',
      });
      const invites = await base44.entities.Invite.filter({ inviter_email: u.email }, '-created_date', 100);
      setSentInvites(invites);
    });
  }, []);

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
    try {
      await base44.users.inviteUser(inviteEmail, 'user');
      await base44.entities.Invite.create({
        inviter_email: user.email,
        invitee_email: inviteEmail,
        signup_status: 'pending'
      });
      await base44.functions.invoke('sendInviteEmail', {
        invitee_email: inviteEmail,
        invitee_name: ''
      });
      toast.success(`Invitation sent to ${inviteEmail}!`);
      setInviteEmail('');
      const invites = await base44.entities.Invite.filter({ inviter_email: user.email }, '-created_date', 100);
      setSentInvites(invites);
    } catch (err) {
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const prevOrg = user?.affiliated_organization;
    const newOrg = form.affiliated_organization;
    await base44.auth.updateMe({
      title: form.title,
      phone: form.phone,
      photo_url: form.photo_url,
      affiliated_organization: newOrg,
      organization_address: form.organization_address,
      bio: form.bio,
      profile_complete: true,
    });
    if (newOrg && newOrg !== prevOrg) {
      const myPets = await base44.entities.Pet.filter({ created_by: user.email });
      await Promise.all(myPets.map(pet => base44.entities.Pet.update(pet.id, { source: newOrg })));
    }
    setUser(u => ({ ...u, affiliated_organization: newOrg }));
    toast.success('Profile updated successfully!');
    setSaving(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setUpdatingPassword(true);
    try {
      await base44.auth.changePassword(currentPassword, newPassword);
      await base44.functions.invoke('sendPasswordChangeEmail', {});
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully! Check your email for confirmation.');
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );

  const joinedCount = sentInvites.filter(i => i.signup_status === 'accepted').length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          <h1 className="text-xl font-bold">notifications & preferences</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-6">

          {/* Invite */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Invite Someone
              </CardTitle>
              <CardDescription>Invite your friends, family members, or colleagues to join every pet!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Referral Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-amber-700">{sentInvites.length}</p>
                  <p className="text-xs text-amber-600 mt-0.5">invites sent</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{joinedCount}</p>
                  <p className="text-xs text-green-600 mt-0.5">friends joined</p>
                </div>
              </div>

              {/* Invite Input */}
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="their@email.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInvite(e)}
                  className="flex-1"
                />
                <Button type="button" variant="outline" disabled={inviting || !inviteEmail} onClick={handleInvite} className="gap-2 shrink-0">
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {inviting ? 'Sending...' : 'Invite'}
                </Button>
              </div>

              {/* Sent Invites List */}
              {sentInvites.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-sm mb-3">Your Invitations</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sentInvites.map(invite => (
                      <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{invite.invitee_email}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(invite.created_date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          invite.signup_status === 'accepted'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {invite.signup_status === 'accepted' ? '✓ Joined' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Pet Preferences */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-4 h-4" /> Pet Preferences
              </CardTitle>
              <CardDescription>Help us find your perfect pet match based on your lifestyle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {prefsSaved && (
                <div className="p-3 bg-green-100 border border-green-300 text-green-800 rounded-lg text-sm">
                  ✓ Preferences saved! <a href={createPageUrl("Recommendations")} className="font-semibold underline">view recommendations</a>
                </div>
              )}
              <PreferencesForm preferences={user?.preferences} onSaved={() => { setPrefsSaved(true); setTimeout(() => setPrefsSaved(false), 3000); }} />

              {/* Email Notifications */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2"><Bell className="w-4 h-4" /> Pet Match Alerts</p>
                    <p className="text-xs text-muted-foreground mt-1">Get emailed when a pet matching your preferences is uploaded</p>
                  </div>
                  <Switch checked={notificationsEnabled} onCheckedChange={handleNotificationToggle} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cloaked Email */}
          <CloakedEmailManager userEmail={user.email} />

          {/* Account Security */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="w-4 h-4" /> Account Security
              </CardTitle>
              <CardDescription>Manage your email address and password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 pb-6 border-b">
                <div>
                  <Label className="text-sm">Current Email</Label>
                  <Input type="email" value={user.email} disabled className="bg-slate-50" />
                </div>
                <p className="text-xs text-slate-500">To change your email address, please contact support.</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <Label htmlFor="current-password" className="text-sm">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="Enter your current password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="new-password" className="text-sm">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter a new password (min 8 characters)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password" className="text-sm">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="outline" disabled={updatingPassword || !currentPassword || !newPassword || !confirmPassword} className="w-full gap-2">
                  {updatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : ''}
                  {updatingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Resource Submissions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resource Submissions</CardTitle>
              <CardDescription>Track the status of resources you've submitted for community use.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResourceStatusView userEmail={user.email} />
            </CardContent>
          </Card>

          <Button className="w-full" disabled={saving} onClick={handleSave}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Save Profile'}
          </Button>

        </div>
      </div>
    </div>
  );
}