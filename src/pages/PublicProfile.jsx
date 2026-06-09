import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useSearchParams, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Globe, User, ArrowLeft, PawPrint, BookOpen } from 'lucide-react';
import { USER_TYPES } from '@/components/profile/UserTypeSelector';
import { formatDistanceToNow } from 'date-fns';

export default function PublicProfile() {
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [posts, setPosts] = useState([]);
  const [pets, setPets] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    
    if (!userId && !email) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    base44.auth.isAuthenticated().then(isAuth => {
      if (!isAuth) {
        const redirectParam = userId ? `userId=${userId}` : `email=${encodeURIComponent(email)}`;
        base44.auth.redirectToLogin(`/PublicProfile?${redirectParam}`);
        return;
      }

      const fetchPromise = userId 
        ? base44.entities.User.list().then(users => users.filter(u => u.id === userId))
        : base44.entities.User.filter({ email });

      fetchPromise.then(async users => {
        if (users.length === 0 || !users[0].share_profile) {
           setNotFound(true);
         } else {
           const userProfile = users[0];
           setProfile(userProfile);
           // Fetch posts and pets in parallel
           const [userPosts, allPets] = await Promise.all([
             base44.entities.Post.filter({ author_email: userProfile.email }, '-created_date', 50).catch(() => []),
             base44.entities.OwnedPet.filter({ owner_email: userProfile.email }, '-created_date', 50).catch(() => []),
           ]);
           const featuredIds = userProfile.featured_pet_ids;
           const filteredPets = featuredIds && featuredIds.length > 0
             ? allPets.filter(p => featuredIds.includes(p.id))
             : allPets;
           setPosts(userPosts);
           setPets(filteredPets);
        }
        setLoading(false);
      }).catch(() => {
        setNotFound(true);
        setLoading(false);
      });
    });
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-rose-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Profile Not Found</h1>
          <p className="text-slate-600 mb-6">This profile is either private or doesn't exist.</p>
          <Link to={createPageUrl('Home')}>
            <Button className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const userType = USER_TYPES.find(t => t.value === profile.user_type);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Link to={createPageUrl('Home')} className="inline-flex mb-6">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          {/* Header / Banner */}
          {profile.banner_url ? (
            <img src={profile.banner_url} alt="Banner" className="h-32 w-full object-cover" />
          ) : (
            <div className="h-24 bg-gradient-to-r from-rose-400 to-pink-400" />
          )}

          <div className="px-6 md:px-8 pb-8">
            {/* Avatar and Info */}
            <div className="flex gap-4 mb-6 -mt-12">
              <div className="relative z-10">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-lg">
                    <User className="w-10 h-10 text-slate-400" />
                  </div>
                )}
              </div>

              <div className="flex-1 pt-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                   <h1 className="text-2xl font-bold text-slate-900">{profile.display_name || profile.full_name}</h1>
                   {userType && (
                     <Badge className="bg-rose-100 text-rose-700 text-xs">
                       {userType.label}
                     </Badge>
                   )}
                 </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-6">
                <p className="text-slate-700 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Location */}
            {(profile.city || profile.state) && (
              <div className="flex items-center gap-2 text-slate-600 mb-4">
                <MapPin className="w-4 h-4" />
                <span>{profile.city}{profile.city && profile.state ? ', ' : ''}{profile.state}</span>
              </div>
            )}

            {/* Website */}
            {profile.website && (
              <div className="flex items-center gap-2 mb-6">
                <Globe className="w-4 h-4 text-slate-600" />
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-[#2c5443] hover:underline text-sm">
                  {profile.website}
                </a>
              </div>
            )}

            {/* Type-specific Info */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              {profile.user_type === 'shelter' || profile.user_type === 'rescue' ? (
                <>
                  {profile.organization_name && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">Organization</p>
                      <p className="text-slate-900">{profile.organization_name}</p>
                    </div>
                  )}
                  {profile.organization_mission && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">Mission</p>
                      <p className="text-slate-700">{profile.organization_mission}</p>
                    </div>
                  )}
                </>
              ) : profile.user_type === 'pet_trainer' || profile.user_type === 'veterinarian' || profile.user_type === 'pet_store' ? (
                <>
                  {profile.services_offered && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">Services</p>
                      <p className="text-slate-700">{profile.services_offered}</p>
                    </div>
                  )}
                  {profile.professional_bio && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">About</p>
                      <p className="text-slate-700">{profile.professional_bio}</p>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'posts' ? 'border-b-2 text-[#b1511d]' : 'text-slate-500 hover:text-slate-700'}`}
              style={activeTab === 'posts' ? { borderBottomColor: '#b1511d' } : {}}
            >
              <BookOpen className="w-4 h-4" /> Posts ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('pets')}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${activeTab === 'pets' ? 'border-b-2 text-[#b1511d]' : 'text-slate-500 hover:text-slate-700'}`}
              style={activeTab === 'pets' ? { borderBottomColor: '#b1511d' } : {}}
            >
              <PawPrint className="w-4 h-4" /> Pets ({pets.length})
            </button>
          </div>

          <div className="p-4 space-y-3">
            {activeTab === 'posts' && (
              posts.length === 0 ? (
                <p className="text-center text-slate-400 py-8">no posts yet.</p>
              ) : posts.map(post => (
                <div key={post.id} className="border border-slate-100 rounded-xl p-4">
                  {post.photo_url && (
                    <img src={post.photo_url} alt="Post" className="w-full rounded-lg object-cover max-h-48 mb-3" />
                  )}
                  {post.content && <p className="text-slate-700 text-sm leading-relaxed">{post.content}</p>}
                  <p className="text-xs text-slate-400 mt-2">{formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}</p>
                </div>
              ))
            )}

            {activeTab === 'pets' && (
              pets.length === 0 ? (
                <p className="text-center text-slate-400 py-8">no pets added yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {pets.map(pet => (
                    <div key={pet.id} className="border border-slate-100 rounded-xl overflow-hidden">
                      {pet.photo_url ? (
                        <img src={pet.photo_url} alt={pet.name} className="w-full h-28 object-cover" />
                      ) : (
                        <div className="w-full h-28 bg-slate-100 flex items-center justify-center text-3xl">🐾</div>
                      )}
                      <div className="p-2">
                        <p className="font-semibold text-slate-800 text-sm">{pet.name}</p>
                        <p className="text-xs text-slate-500">{pet.pet_type}{pet.breed ? ` · ${pet.breed}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}