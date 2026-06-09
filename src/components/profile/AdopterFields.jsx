import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdopterFields({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <Label className="mb-1.5 block">Volunteer With a Shelter/Rescue (Optional)</Label>
        <Input
          value={data.volunteer_shelter || ''}
          onChange={e => onChange('volunteer_shelter', e.target.value)}
          placeholder="e.g., Happy Paws Rescue, Best Friends Animal Society"
        />
      </div>
    </div>
  );
}