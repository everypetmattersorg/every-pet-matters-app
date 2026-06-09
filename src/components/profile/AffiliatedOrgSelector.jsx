import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function AffiliatedOrgSelector({ value, onChange }) {
  const [showCustom, setShowCustom] = useState(false);

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['shelter-rescue-orgs'],
    queryFn: async () => {
      const [shelters, rescues] = await Promise.all([
        base44.entities.ShelterDetails.list(),
        base44.entities.Rescue.list()
      ]);
      return [
        ...shelters.map(s => ({ id: s.id, name: s.shelter_name, type: 'shelter' })),
        ...rescues.map(r => ({ id: r.id, name: r.name, type: 'rescue' }))
      ].sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  useEffect(() => {
    if (value && !orgs.some(o => o.name === value)) {
      setShowCustom(true);
    }
  }, [orgs, value]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">Loading organizations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="mb-1.5 block">Affiliated Organization</Label>
      {!showCustom ? (
        <Select value={value || ''} onValueChange={(val) => {
          if (val === '__custom__') {
            setShowCustom(true);
            onChange('');
          } else {
            onChange(val);
          }
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Select a shelter or rescue..." />
          </SelectTrigger>
          <SelectContent>
            {orgs.map(org => (
              <SelectItem key={org.id} value={org.name}>
                <span className="text-xs mr-2 text-slate-400 capitalize">{org.type}</span>
                {org.name}
              </SelectItem>
            ))}
            <div className="border-t my-1" />
            <SelectItem value="__custom__">
              <span className="text-slate-500">+ Enter custom organization</span>
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="flex gap-2">
          <Input
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder="Enter organization name"
          />
          <button
            onClick={() => {
              setShowCustom(false);
              onChange('');
            }}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}