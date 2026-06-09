import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function UserPreferencesPanel({ user }) {
  const [prefs, setPrefs] = useState({
    preferred_species: user?.preferred_species || '',
    preferred_size: user?.preferred_size || '',
    preferred_age: user?.preferred_age || '',
    kid_friendly: user?.kid_friendly || '',
    dog_friendly: user?.dog_friendly || '',
    cat_friendly: user?.cat_friendly || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setPrefs(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(prefs);
    toast.success('Preferences saved!');
    setSaving(false);
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border p-6 space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Match Preferences</h2>
        <p className="text-sm text-muted-foreground">We'll use these to help recommend pets for you.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Preferred Species</Label>
          <Select value={prefs.preferred_species} onValueChange={v => set('preferred_species', v)}>
            <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Any</SelectItem>
              <SelectItem value="Dog">Dog</SelectItem>
              <SelectItem value="Cat">Cat</SelectItem>
              <SelectItem value="Bird">Bird</SelectItem>
              <SelectItem value="Rabbit">Rabbit</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Preferred Size</Label>
          <Select value={prefs.preferred_size} onValueChange={v => set('preferred_size', v)}>
            <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Any</SelectItem>
              <SelectItem value="Small">Small</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Large">Large</SelectItem>
              <SelectItem value="Extra Large">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Preferred Age</Label>
          <Select value={prefs.preferred_age} onValueChange={v => set('preferred_age', v)}>
            <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Any</SelectItem>
              <SelectItem value="puppy">Puppy / Kitten</SelectItem>
              <SelectItem value="young">Young</SelectItem>
              <SelectItem value="adult">Adult</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {[
          { key: 'kid_friendly', label: 'Good with Kids' },
          { key: 'dog_friendly', label: 'Good with Dogs' },
          { key: 'cat_friendly', label: 'Good with Cats' },
        ].map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <Label>{label}</Label>
            <Select value={prefs[key]} onValueChange={v => set(key, v)}>
              <SelectTrigger><SelectValue placeholder="No preference" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No preference</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Save Preferences'}
      </Button>
    </div>
  );
}