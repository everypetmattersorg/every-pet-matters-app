import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, MapPin, Phone, Mail, Globe, Clock, Star, Calendar, ExternalLink, ThumbsUp, Loader2 } from 'lucide-react';

const CATEGORY_CONFIG = {
  veterinarian:          { label: 'Veterinarian',  emoji: '🏥' },
  groomer:               { label: 'Groomer',        emoji: '✂️' },
  trainer:               { label: 'Trainer',        emoji: '🎓' },
  pet_sitter:            { label: 'Pet Sitter',     emoji: '🏠' },
  pet_store:             { label: 'Pet Store',      emoji: '🛒' },
  pet_friendly_business: { label: 'Pet-Friendly',   emoji: '🐾' },
  other:                 { label: 'Other',          emoji: '📍' },
};

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => onChange(i)}>
          <Star className={`w-7 h-7 transition-colors ${i <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
        </button>
      ))}
    </div>
  );
}

export default function ServiceDetail({ service, currentUser, onClose }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [recommend, setRecommend] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const cfg = CATEGORY_CONFIG[service.category] || CATEGORY_CONFIG.other;

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', service.id],
    queryFn: () => base44.entities.ServiceReview.filter({ service_id: service.id }, '-created_date', 50),
  });

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const alreadyReviewed = reviews.some(r => r.reviewer_email === currentUser?.email);

  const handleReview = async () => {
    if (!currentUser || !comment.trim()) return;
    setSubmitting(true);
    await base44.entities.ServiceReview.create({
      service_id: service.id,
      reviewer_email: currentUser.email,
      reviewer_name: currentUser.full_name || currentUser.email.split('@')[0],
      rating,
      comment: comment.trim(),
      would_recommend: recommend,
    });
    setComment('');
    setSubmitting(false);
    queryClient.invalidateQueries({ queryKey: ['reviews', service.id] });
    queryClient.invalidateQueries({ queryKey: ['services'] });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Hero */}
        <div className="relative h-48 bg-gradient-to-br from-slate-700 to-slate-900 overflow-hidden">
          {service.photo_url
            ? <img src={service.photo_url} alt={service.name} className="w-full h-full object-cover opacity-80" />
            : <div className="w-full h-full flex items-center justify-center text-7xl">{cfg.emoji}</div>
          }
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{service.name}</h2>
              <p className="text-sm text-slate-500">{cfg.label}</p>
            </div>
            {reviews.length > 0 && (
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}
                </div>
                <p className="text-xs text-slate-400">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>

          {service.description && <p className="text-slate-600 text-sm mb-4">{service.description}</p>}

          {/* Info grid */}
          <div className="space-y-2 mb-5">
            {service.address && (
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4 mt-0.5 text-rose-400 flex-shrink-0" />
                {service.address}{service.city ? `, ${service.city}` : ''}{service.state ? ` ${service.state}` : ''}{service.zip ? ` ${service.zip}` : ''}
              </div>
            )}
            {service.hours && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                {service.hours}
              </div>
            )}
            {service.phone && (
              <a href={`tel:${service.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <Phone className="w-4 h-4 flex-shrink-0" />
                {service.phone}
              </a>
            )}
            {service.email && (
              <a href={`mailto:${service.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <Mail className="w-4 h-4 flex-shrink-0" />
                {service.email}
              </a>
            )}
            {service.website && (
              <a href={service.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <Globe className="w-4 h-4 flex-shrink-0" />
                {service.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>

          {/* Booking / Contact CTA */}
          <div className="flex gap-3 mb-6">
            {service.accepts_bookings && service.booking_url ? (
              <a href={service.booking_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 gap-2">
                  <Calendar className="w-4 h-4" /> Book Appointment
                </Button>
              </a>
            ) : service.phone ? (
              <a href={`tel:${service.phone}`} className="flex-1">
                <Button className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 gap-2">
                  <Phone className="w-4 h-4" /> Call to Book
                </Button>
              </a>
            ) : null}
            {service.email && (
              <a href={`mailto:${service.email}?subject=Inquiry about ${service.name}`} className="flex-1">
                <Button variant="outline" className="w-full rounded-xl gap-2">
                  <Mail className="w-4 h-4" /> Email
                </Button>
              </a>
            )}
          </div>

          {/* Reviews */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="font-bold text-slate-800 mb-4">Reviews</h3>
            {reviews.length === 0 && <p className="text-sm text-slate-400 mb-4">No reviews yet — be the first!</p>}
            <div className="space-y-3 mb-5">
              {reviews.map(r => (
                <div key={r.id} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-slate-700">{r.reviewer_name}</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />)}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
                  {r.would_recommend && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600">
                      <ThumbsUp className="w-3 h-3" /> Would recommend
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Review */}
            {currentUser && !alreadyReviewed && (
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-slate-700 text-sm">Leave a Review</h4>
                <StarPicker value={rating} onChange={setRating} />
                <Textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="resize-none h-20"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={recommend} onChange={e => setRecommend(e.target.checked)} className="rounded" />
                    Would recommend
                  </label>
                  <Button onClick={handleReview} disabled={submitting || !comment.trim()} className="rounded-xl bg-rose-500 hover:bg-rose-600">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Submit
                  </Button>
                </div>
              </div>
            )}
            {alreadyReviewed && <p className="text-xs text-slate-400 text-center">You've already reviewed this service.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}