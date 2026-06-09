import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { ScanSearch, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function PhotoMatchHistory({ userEmail }) {
  const { data: searches = [], isLoading } = useQuery({
    queryKey: ['photo-match-searches'],
    queryFn: () => base44.entities.PhotoMatchSearch.filter({ user_email: userEmail }, '-created_date', 10),
    enabled: !!userEmail,
  });

  if (isLoading) return <div className="text-slate-400 text-sm py-4">Loading search history...</div>;
  if (searches.length === 0) return (
    <div className="text-center py-10">
      <ScanSearch className="w-10 h-10 text-slate-200 mx-auto mb-3" />
      <p className="text-slate-400 text-sm">No photo searches yet.</p>
      <Link to={createPageUrl('PhotoMatch')} className="text-violet-600 text-sm font-medium hover:underline mt-1 inline-block">
        Try Photo Match →
      </Link>
    </div>
  );

  return (
    <div className="space-y-3">
      {searches.map(search => (
        <Link
          key={search.id}
          to={createPageUrl('PhotoMatch')}
          className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50 transition-colors group"
        >
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
            {search.photo_url ? (
              <img src={search.photo_url} alt="Search" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 line-clamp-1">{search.pet_description || 'Pet photo search'}</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {search.species && <Badge className="text-xs bg-violet-100 text-violet-700 capitalize">{search.species}</Badge>}
              {search.breed_guess && <Badge className="text-xs bg-blue-100 text-blue-700">{search.breed_guess}</Badge>}
              {search.color && <Badge className="text-xs bg-amber-100 text-amber-700">{search.color}</Badge>}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {format(new Date(search.created_date), 'MMM d, yyyy')} · {search.match_count ?? 0} match{search.match_count !== 1 ? 'es' : ''} found
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 flex-shrink-0 transition-colors" />
        </Link>
      ))}
    </div>
  );
}