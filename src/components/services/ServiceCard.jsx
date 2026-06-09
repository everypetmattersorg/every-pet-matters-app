import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Star, ExternalLink, Calendar, Clock } from 'lucide-react';

const CATEGORY_CONFIG = {
  veterinarian:          { label: 'Veterinarian',        emoji: '🏥', color: 'bg-blue-100 text-blue-700' },
  groomer:               { label: 'Groomer',             emoji: '✂️', color: 'bg-pink-100 text-pink-700' },
  trainer:               { label: 'Trainer',             emoji: '🎓', color: 'bg-amber-100 text-amber-700' },
  pet_sitter:            { label: 'Pet Sitter',          emoji: '🏠', color: 'bg-violet-100 text-violet-700' },
  pet_store:             { label: 'Pet Store',           emoji: '🛒', color: 'bg-emerald-100 text-emerald-700' },
  pet_friendly_business: { label: 'Pet-Friendly',        emoji: '🐾', color: 'bg-rose-100 text-rose-700' },
  other:                 { label: 'Other',               emoji: '📍', color: 'bg-slate-100 text-slate-600' },
};

function StarRating({ rating, count }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
      ))}
      {count > 0 && <span className="text-xs text-slate-500 ml-1">{rating.toFixed(1)} ({count})</span>}
    </div>
  );
}

export default function ServiceCard({ service, avgRating, reviewCount, onClick }) {
  const cfg = CATEGORY_CONFIG[service.category] || CATEGORY_CONFIG.other;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      <div className="relative h-36 bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
        {service.photo_url
          ? <img src={service.photo_url} alt={service.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-5xl">{cfg.emoji}</div>
        }
        <div className="absolute top-3 left-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
        </div>
        {service.accepts_bookings && (
          <div className="absolute top-3 right-3">
            <span className="text-xs px-2 py-1 rounded-full font-medium bg-emerald-500 text-white">Bookable</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-slate-800 mb-1 truncate">{service.name}</h3>
        {reviewCount > 0
          ? <StarRating rating={avgRating} count={reviewCount} />
          : <p className="text-xs text-slate-400">No reviews yet</p>
        }
        {service.address && (
          <div className="flex items-start gap-1 mt-2 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-rose-400" />
            <span className="truncate">{service.address}{service.city ? `, ${service.city}` : ''}</span>
          </div>
        )}
        {service.hours && (
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            <span className="truncate">{service.hours}</span>
          </div>
        )}
        {service.phone && (
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
            <Phone className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            {service.phone}
          </div>
        )}
      </div>
    </div>
  );
}