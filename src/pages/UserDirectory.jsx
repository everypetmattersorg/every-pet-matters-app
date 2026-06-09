import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HERO_COLORS } from '@/lib/heroConfig';

export default function UserDirectory() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['public-users'],
    queryFn: async () => {
      const allUsers = await base44.entities.User.list();
      return allUsers.filter(u => u.share_profile);
    }
  });

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Split Header */}
      <div className="px-4 py-6" style={{ background: HERO_COLORS.background }}>
        <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden flex flex-col md:flex-row" style={{ minHeight: '300px' }}>
          <div className="md:w-1/2 w-full min-h-48 md:min-h-0 h-full">
            <img src="https://media.base44.com/images/public/69a0f10efc1058c9e80d1210/15444bd73_IMG_3036.JPG"
            alt="Pet community"
            className="w-full h-full object-cover"
            style={{ display: 'block', minHeight: '340px' }} />
          </div>
          <div className="md:w-1/2 w-full flex flex-col justify-center px-10 py-10" style={{ background: HERO_COLORS.panelBg }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-5 self-start" style={{ background: HERO_COLORS.badgeBg, color: HERO_COLORS.badgeText }}>
              <span className="text-lg">👥</span> pet community members
            </div>
            <h1 className="text-5xl font-black mb-4 leading-tight" style={{ color: HERO_COLORS.panelText }}>connect with pet lovers</h1>
            <p className="text-lg max-w-sm leading-relaxed" style={{ color: HERO_COLORS.panelSubtext }}>discover people in your community who share your passion for animals.</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-12 px-4">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">🐾</div>
            <p className="text-slate-500">No members found yet. Be the first!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((profile) => {
              const isCurrentUser = user && profile.id === user.id;
              return (
                <Link key={profile.id} to={`/PublicProfile?userId=${profile.id}`}>
                  <div className={`bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all cursor-pointer h-full flex flex-col ${isCurrentUser ? 'border-amber-400 shadow-md' : 'border-slate-200'}`}>
                    <div className="h-32 bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center relative overflow-hidden">
                      {profile.banner_url ? (
                        <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
                      ) : null}
                      <div className="absolute inset-0 bg-black/10" />
                      {isCurrentUser && (
                        <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">you</span>
                      )}
                    </div>
                    <div className="px-6 py-4 flex flex-col flex-1 -mt-8 relative z-10">
                      <div className="flex gap-4 mb-4 items-end">
                        {profile.avatar_url ? (
                          <div className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-md shrink-0 overflow-hidden">
                            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-md text-3xl shrink-0">🐾</div>
                        )}
                        <div className="flex-1 pb-1">
                          <h3 className="font-bold text-lg leading-tight">{profile.full_name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">since {new Date(profile.created_date).getFullYear()}</p>
                        </div>
                      </div>
                      {profile.bio && <p className="text-sm text-slate-600 mb-4 line-clamp-2">{profile.bio}</p>}
                      <div className="mt-auto pt-2">
                        <span className="inline-block bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">{isCurrentUser ? 'view your profile' : 'view profile'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}