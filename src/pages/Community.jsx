import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Users, MapPin } from 'lucide-react';
import { HERO_COLORS } from '@/lib/heroConfig';
import PostComposer from '@/components/community/PostComposer';
import PostCard from '@/components/community/PostCard';

const FILTERS = [
{ label: 'All', value: 'all' },
{ label: '📖 Stories', value: 'story' },
{ label: '📷 Photos', value: 'photo' },
{ label: '📅 Events', value: 'event' }];


export default function Community() {
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  useEffect(() => {base44.auth.me().then(setUser).catch(() => {});}, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list('-created_date', 50)
  });

  const filtered = filter === 'all' ? posts : posts.filter((p) => p.post_type === filter);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Hero */}
      <div className="px-4 py-6" style={{ background: HERO_COLORS.background }}>
        <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden flex flex-col md:flex-row" style={{ minHeight: '300px' }}>
          <div className="md:w-1/2 w-full min-h-48 md:min-h-0 h-full relative">
            <img src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/a28693130_Olle___Echo-05.JPG"
            alt="Pet community"
            className="w-full h-full object-cover"
            style={{ display: 'block', minHeight: '340px' }} />
            <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
              📸 photo of ollie & echo, captured by stephen martin
            </div>
          </div>
          <div className="md:w-1/2 w-full flex flex-col justify-center px-10 py-10" style={{ background: HERO_COLORS.panelBg }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-5 self-start" style={{ background: HERO_COLORS.badgeBg, color: HERO_COLORS.badgeText }}>
              <Users className="w-4 h-4" /> connect with pet lovers
            </div>
            <h1 className="text-5xl font-black mb-4 leading-tight" style={{ color: HERO_COLORS.panelText }}>community</h1>
            <p className="text-lg max-w-sm leading-relaxed" style={{ color: HERO_COLORS.panelSubtext }}>stories, photos, and events from fellow pet lovers.</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto py-8 px-4">

        {/* Directory Button */}
        <div className="mb-6">
          <Link to="/UserDirectory">
            <button className="w-full px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 text-white hover:opacity-90"
            style={{ backgroundColor: '#EAB308' }}>
              <MapPin className="w-4 h-4" />
              see humans in the pet community near you
            </button>
          </Link>
        </div>

        {/* Composer */}
        {user &&
        <div className="mb-6">
            <PostComposer user={user} onPosted={() => queryClient.invalidateQueries({ queryKey: ['posts'] })} />
          </div>
        }

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTERS.map((f) =>
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${filter === f.value ? 'text-white' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
            style={filter === f.value ? { backgroundColor: '#b1511d' } : {}}>
            
              {f.label}
            </button>
          )}
        </div>

        {/* Feed */}
        {isLoading ?
        <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
          </div> :
        filtered.length === 0 ?
        <div className="text-center py-20">
            <div className="text-5xl mb-3">🐾</div>
            <p className="text-slate-500">No posts yet. Be the first to share!</p>
          </div> :

        <div className="space-y-4">
            {filtered.map((post) =>
          <PostCard key={post.id} post={post} currentUser={user} />
          )}
          </div>
        }
      </div>
    </div>);

}