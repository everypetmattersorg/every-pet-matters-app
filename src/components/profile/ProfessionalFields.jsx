import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AffiliatedOrgSelector from './AffiliatedOrgSelector';

export default function ProfessionalFields({ data, onChange, label }) {
  return (
    <div className="space-y-4">
      <AffiliatedOrgSelector value={data.affiliated_organization || ''} onChange={(val) => onChange('affiliated_organization', val)} />
      <div>
        <Label className="mb-1.5 block">Services Offered</Label>
        <Textarea
          value={data.services_offered || ''}
          onChange={e => onChange('services_offered', e.target.value)}
          placeholder={`Describe your ${label} services...`}
          className="h-24"
        />
      </div>
      <div>
        <Label className="mb-1.5 block">Specializations</Label>
        <Input
          value={data.specializations || ''}
          onChange={e => onChange('specializations', e.target.value)}
          placeholder="e.g. Large breeds, exotic animals, behavior therapy"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5 block">Years of Experience</Label>
          <Input
            type="number"
            value={data.years_experience || ''}
            onChange={e => onChange('years_experience', Number(e.target.value))}
            placeholder="0"
          />
        </div>
        <div>
          <Label className="mb-1.5 block">Certifications</Label>
          <Input
            value={data.certifications || ''}
            onChange={e => onChange('certifications', e.target.value)}
            placeholder="e.g. CPDT-KA, AVMA"
          />
        </div>
      </div>
    </div>
  );
}