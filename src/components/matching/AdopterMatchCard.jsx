import React from 'react';
import { Mail, Phone, MapPin, Zap, Award, Users, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function AdopterMatchCard({ match }) {
  const { adopter, score, reasons } = match;
  
  return (
    <Card className="p-4 border border-slate-200 hover:border-rose-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-slate-800">{adopter.full_name}</h3>
          <p className="text-sm text-slate-600">{adopter.email}</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-2xl font-bold text-rose-600">{score}%</div>
          <p className="text-xs text-slate-500">Match</p>
        </div>
      </div>

      {/* Quick Info */}
      <div className="space-y-2 mb-3 pb-3 border-b border-slate-100">
        {adopter.pet_preferences?.living_situation && (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="capitalize">{adopter.pet_preferences.living_situation} living</span>
          </div>
        )}
        {adopter.pet_preferences?.experience_level && (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Award className="w-4 h-4 text-slate-400" />
            <span className="capitalize">{adopter.pet_preferences.experience_level.replace('_', ' ')} pet owner</span>
          </div>
        )}
        {adopter.pet_preferences?.has_kids !== undefined && (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Users className="w-4 h-4 text-slate-400" />
            <span>{adopter.pet_preferences.has_kids ? 'Has children' : 'No children'}</span>
          </div>
        )}
      </div>

      {/* Match Reasons */}
      {reasons.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-slate-600 mb-2">Why they're a great match:</p>
          <div className="space-y-1">
            {reasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Heart className="w-3 h-3 text-rose-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-700">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Info */}
      {adopter.phone && (
        <div className="flex items-center gap-2 text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100">
          <Phone className="w-4 h-4 text-slate-400" />
          <span>{adopter.phone}</span>
        </div>
      )}
    </Card>
  );
}