import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Share2, Trash2, ShieldCheck, Activity, Eye, EyeOff } from 'lucide-react';

const petEmoji = { dog: '🐕', cat: '🐱', bird: '🐦', rabbit: '🐰', other: '🐾' };

export default function OwnedPetCard({ pet, onEdit, onShare, onDelete, onToggleVisibility }) {
  const age = pet.age_years
    ? `${pet.age_years}y${pet.age_months ? ` ${pet.age_months}m` : ''}`
    : pet.age_months ? `${pet.age_months}mo` : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-50">
        {pet.photo_url ? (
          <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {petEmoji[pet.pet_type] || '🐾'}
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {pet.looking_for_sitter && (
            <Badge className="bg-violet-500 text-white text-xs">Needs Sitter</Badge>
          )}
          {pet.looking_for_trainer && (
            <Badge className="bg-amber-500 text-white text-xs">Needs Trainer</Badge>
          )}
        </div>
        {pet.share_profile && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-emerald-500 text-white text-xs">Shared</Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-lg text-slate-800">{pet.name}</h3>
            <p className="text-sm text-slate-500">
              {pet.breed || pet.pet_type}{age ? ` • ${age}` : ''}{pet.gender && pet.gender !== 'unknown' ? ` • ${pet.gender}` : ''}
            </p>
          </div>
          <span className="text-2xl">{petEmoji[pet.pet_type]}</span>
        </div>

        {/* Quick info badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {pet.vaccinations && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-3 h-3" /> Vaccinated
            </span>
          )}
          {pet.energy_level && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
              <Activity className="w-3 h-3" /> {pet.energy_level} energy
            </span>
          )}
        </div>

        {pet.behavioral_notes && (
          <p className="text-xs text-slate-400 mb-3 line-clamp-2 italic">"{pet.behavioral_notes}"</p>
        )}

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(pet)} className="flex-1 rounded-xl">
            <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
          {onToggleVisibility && (
            <Button size="sm" variant="outline" onClick={() => onToggleVisibility(pet)} className={`rounded-xl px-2.5 ${pet.share_profile ? 'text-blue-600 border-blue-200 hover:bg-blue-50' : 'text-slate-400 border-slate-200 hover:bg-slate-50'}`}>
              {pet.share_profile ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onShare(pet)} className="rounded-xl text-emerald-600 border-emerald-200 hover:bg-emerald-50 px-2.5">
            <Share2 className="w-3.5 h-3.5" />
          </Button>
          {onDelete && (
            <Button size="sm" variant="outline" onClick={() => onDelete(pet)} className="rounded-xl text-red-400 border-red-100 hover:bg-red-50 px-2.5">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}