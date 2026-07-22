import React from 'react';
import { cn } from '@/lib/utils';

const USER_TYPES = [
  { value: 'adopter',      label: 'Adopter',                    emoji: '🏠', desc: 'Looking to adopt a pet' },
  { value: 'pet_owner',    label: 'Pet Parent',                 emoji: '🐾', desc: 'I have a pet' },
  { value: 'volunteer',    label: 'Volunteer',                  emoji: '💛', desc: 'I volunteer with animals' },
  { value: 'shelter',      label: 'Shelter',                    emoji: '🏢', desc: 'Animal shelter organization' },
  { value: 'rescue',       label: 'Rescue / Animal Welfare',    emoji: '🦺', desc: 'Rescue or animal welfare group' },
  { value: 'pet_store',    label: 'Pet Store',                  emoji: '🛒', desc: 'Retail pet supplies & animals' },
  { value: 'pet_trainer',  label: 'Pet Trainer',                emoji: '🎓', desc: 'Professional animal trainer' },
  { value: 'veterinarian', label: 'Veterinarian',               emoji: '🩺', desc: 'Veterinary professional' },
];

export { USER_TYPES };

// values is string[] (up to 3 selected)
export default function UserTypeSelector({ values = [], onChange }) {
  const toggle = (val) => {
    if (values.includes(val)) {
      onChange(values.filter(v => v !== val));
    } else if (values.length < 3) {
      onChange([...values, val]);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Select up to 3 that apply</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {USER_TYPES.map(type => {
          const selected = values.includes(type.value);
          const maxed = !selected && values.length >= 3;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => toggle(type.value)}
              disabled={maxed}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all',
                selected
                  ? 'bg-yellow-50 shadow-md'
                  : maxed
                  ? 'border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed'
                  : 'border-slate-200 bg-white hover:border-yellow-300 hover:bg-yellow-50/50'
              )}
              style={selected ? { borderColor: '#b1511d', background: '#FDF0E8' } : {}}
            >
              <span className="text-3xl">{type.emoji}</span>
              <span className="font-semibold text-sm text-slate-800">{type.label}</span>
              <span className="text-xs text-slate-500 leading-tight">{type.desc}</span>
              {selected && (
                <span className="text-xs font-bold" style={{ color: '#b1511d' }}>✓ selected</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
