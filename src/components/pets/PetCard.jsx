import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2, MessageSquare, Heart, Crosshair } from 'lucide-react';
import FocalPointPicker from './FocalPointPicker';
import { browsingTracker } from '@/components/chatbot/ChatBot';
import { toast } from 'sonner';

const petTypeIcons = {
  dog: '🐕',
  cat: '🐱',
  bird: '🐦',
  rabbit: '🐰',
  other: '🐾'
};

const statusColors = {
  lost: 'bg-rose-100 text-rose-700 border-rose-200',
  found: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  reunited: 'bg-violet-100 text-violet-700 border-violet-200'
};

export default function PetCard({ pet }) {
  const navigate = useNavigate();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showFocalPicker, setShowFocalPicker] = useState(false);
  const [user, setUser] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser) {
          const favorites = await base44.entities.Favorite.filter({
            user_email: currentUser.email,
            pet_id: pet.id,
            pet_type: 'lost_found'
          });
          setIsFavorited(favorites.length > 0);
        }
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, [pet.id]);

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        const favorites = await base44.entities.Favorite.filter({
          user_email: user.email,
          pet_id: pet.id,
          pet_type: 'lost_found'
        });
        if (favorites.length > 0) {
          await base44.entities.Favorite.delete(favorites[0].id);
        }
      } else {
        await base44.entities.Favorite.create({
          user_email: user.email,
          pet_id: pet.id,
          pet_type: 'lost_found'
        });
      }
    },
    onSuccess: () => {
      setIsFavorited(!isFavorited);
      toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites!');
    }
  });

  const handleShare = (platform) => {
    const url = `${window.location.origin}${createPageUrl(`PetDetails?id=${pet.id}`)}`;
    const text = `Help find ${pet.name || 'this pet'}!`;
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      copy: null
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  return (
    <div onClick={() => browsingTracker.record(pet.pet_type)}>
      <Card className="overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-shadow h-full flex flex-col cursor-pointer">
         {/* Image Section */}
         <div 
           className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 cursor-pointer"
           onClick={() => navigate(createPageUrl(`PetDetails?id=${pet.id}`))}
         >
          {pet.photo_url ? (
           <img 
             src={pet.photo_url} 
             alt={pet.name || 'Pet'} 
             className="w-full h-full object-cover"
             style={{ objectPosition: pet.photo_focal_points?.[0] || '50% 50%' }}
           />
          ) : (
           <div className="w-full h-full flex items-center justify-center text-6xl">
             {petTypeIcons[pet.pet_type] || '🐾'}
           </div>
          )}
          {/* Focal point picker overlay */}
          {showFocalPicker && pet.photo_url && (
           <div
             className="absolute inset-0 bg-black/80 z-20 p-3 flex flex-col justify-center"
             onClick={e => e.stopPropagation()}
           >
             <FocalPointPicker
               imageUrl={pet.photo_url}
               initialPoint={pet.photo_focal_points?.[0]}
               onSave={async (point) => {
                 const updatedPoints = [...(pet.photo_focal_points || [])];
                 updatedPoints[0] = point;
                 await base44.entities.Pet.update(pet.id, { photo_focal_points: updatedPoints });
                 setShowFocalPicker(false);
                 toast.success('Focal point saved!');
               }}
               onCancel={() => setShowFocalPicker(false)}
             />
           </div>
          )}
          {/* Shelter Badge */}
          {pet.source && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-slate-700 text-white text-xs px-2 py-1">
                {pet.source}
              </Badge>
            </div>
          )}
          {/* Heart Icon */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (user) {
                favoriteMutation.mutate();
              } else {
                base44.auth.redirectToLogin();
              }
            }}
            className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full transition"
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
          </button>
          {/* Focal point edit button (admin only) */}
          {user?.role === 'admin' && pet.photo_url && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowFocalPicker(true); }}
              className="absolute top-3 left-3 bg-white/90 hover:bg-white p-2 rounded-full transition"
              title="Set focal point"
            >
              <Crosshair className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>

        {/* Content Section */}
        <CardContent 
          className="p-4 flex-1 flex flex-col cursor-pointer"
          onClick={() => navigate(createPageUrl(`PetDetails?id=${pet.id}`))}
        >
          {/* Pet Name and Organization */}
          <div className="mb-3">
            <h3 className="font-semibold text-base text-slate-800">
              {pet.name || `${pet.pet_type.charAt(0).toUpperCase() + pet.pet_type.slice(1)}`}
            </h3>
            {pet.contact && (
              <p className="text-xs text-slate-600 font-medium">{pet.contact}</p>
            )}
          </div>

          {/* Tags Section */}
          <div className="flex flex-wrap gap-2 mb-3">
            {pet.location && (
              <Badge variant="outline" className="text-xs">{pet.location}</Badge>
            )}
            {pet.stipend_available && (
              <Badge className="bg-green-600 text-white text-xs">Stipend Available</Badge>
            )}
          </div>

          {/* Details */}
          <div className="text-xs text-slate-600 space-y-1 flex-1">
            <div>
              <span className="font-medium">Species</span>
              <div className="text-slate-700">{pet.species || pet.pet_type}</div>
            </div>
            {pet.breed && (
              <div>
                <span className="font-medium">Breed</span>
                <div className="text-slate-700">{pet.breed}</div>
              </div>
            )}
            {pet.age && (
              <div>
                <span className="font-medium">Age</span>
                <div className="text-slate-700">{pet.age}</div>
              </div>
            )}
            {pet.gender && (
              <div>
                <span className="font-medium">Gender</span>
                <div className="text-slate-700 capitalize">{pet.gender}</div>
              </div>
            )}
            {pet.weight && (
              <div>
                <span className="font-medium">Weight</span>
                <div className="text-slate-700">{pet.weight} lbs</div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200">
            <Link to={createPageUrl(`PetDetails?id=${pet.id}`)} className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white text-xs h-8">
                <MessageSquare className="w-3 h-3 mr-1" />
                Contact
              </Button>
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowShareMenu(!showShareMenu);
              }}
              className="flex-1"
            >
              <Button variant="outline" className="w-full text-xs h-8">
                <Share2 className="w-3 h-3 mr-1" />
                Share
              </Button>
            </button>
          </div>

          {showShareMenu && (
            <div className="absolute mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-20 w-40">
              <button onClick={(e) => { e.preventDefault(); handleShare('facebook'); }} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded">Facebook</button>
              <button onClick={(e) => { e.preventDefault(); handleShare('twitter'); }} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded">Twitter</button>
              <button onClick={(e) => { e.preventDefault(); handleShare('whatsapp'); }} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded">WhatsApp</button>
              <button onClick={(e) => { e.preventDefault(); handleShare('copy'); }} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded">Copy Link</button>
              <div className="border-t border-slate-200 my-1"></div>
              {pet.social_media_graphics?.instagram && (
                <a href={pet.social_media_graphics.instagram} download="instagram-graphic.png" className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded block">📷 Instagram Graphic</a>
              )}
              {pet.social_media_graphics?.facebook && (
                <a href={pet.social_media_graphics.facebook} download="facebook-graphic.png" className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded block">📘 Facebook Graphic</a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}