import React from 'react';
import { cn } from '@/lib/utils';

const USER_TYPES = [
  { value: 'adopter',     label: 'Adopter',       emoji: '🏠', desc: 'Looking to adopt a pet' },
  { value: 'pet_owner',   label: 'Pet Parent',    emoji: '🐾', desc: 'I own a pet' },
  { value: 'shelter',     label: 'Shelter',       emoji: '🏢', desc: 'Animal shelter organization' },
  { value: 'rescue',      label: 'Rescue',        emoji: '🦺', desc: 'Pet rescue group' },
  { value: 'pet_store',   label: 'Pet Store',     emoji: '🛒', desc: 'Retail pet supplies & animals' },
  { value: 'pet_trainer', label: 'Pet Trainer',   emoji: '🎓', desc: 'Professional animal trainer' },
  { value: 'veterinarian',label: 'Veterinarian',  emoji: '🩺', desc: 'Veterinary professional' },
  { value: 'other',       label: 'Volunteer/Other', emoji: '💛', desc: 'Volunteer or general community' },
];

export { USER_TYPES };

export default function UserTypeSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {USER_TYPES.map(type => (
        <button
          key={type.value}
          type="button"
          onClick={() => onChange(type.value)}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all',
            value === type.value
              ? 'bg-yellow-100 text-yellow-700 shadow-md'
              : 'border-slate-200 bg-white hover:border-yellow-300 hover:bg-yellow-50/50'
          )}
          style={value === type.value ? { borderColor: '#b1511d' } : {}}
        >
          <span className="text-3xl">{type.emoji}</span>
          <span className="font-semibold text-sm text-slate-800">{type.label}</span>
          <span className="text-xs text-slate-500 leading-tight">{type.desc}</span>
        </button>
      ))}
    </div>
  );
}