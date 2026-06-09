import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export default function ShelterRescueFields({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-1.5 block">License / Registration Number</Label>
        <Input
          value={data.shelter_license || ''}
          onChange={e => onChange('shelter_license', e.target.value)}
          placeholder="e.g. SH-2024-00123"
        />
      </div>
      <div>
        <Label className="mb-1.5 block">Animal Capacity</Label>
        <Input
          type="number"
          value={data.capacity || ''}
          onChange={e => onChange('capacity', Number(e.target.value))}
          placeholder="Max animals you can house"
        />
      </div>
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
        <div>
          <Label>Nonprofit Organization</Label>
          <p className="text-xs text-slate-500 mt-0.5">Do you have 501(c)(3) or equivalent status?</p>
        </div>
        <Switch checked={!!data.nonprofit_status} onCheckedChange={v => onChange('nonprofit_status', v)} />
      </div>
    </div>
  );
}