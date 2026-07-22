import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, CalendarDays, FileText, Loader2, X, PawPrint, Video } from 'lucide-react';
import OrganizationTagger from './OrganizationTagger';
import { toast } from 'sonner';

const TYPES = [
  { value: 'story', label: 'Story', icon: FileText, color: 'text-violet-500' },
  { value: 'photo', label: 'Photo', icon: Camera, color: 'text-rose-500' },
  { value: 'event', label: 'Event', icon: CalendarDays, color: 'text-amber-500' },
];

const MAX_PHOTOS = 10;

export default function PostComposer({ user, onPosted }) {
  const [type, setType] = useState('story');
  const [content, setContent] = useState('');
  const [petName, setPetName] = useState('');
  const [selectedPetId, setSelectedPetId] = useState('');
  const [photoUrls, setPhotoUrls] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState({ title: '', date: '', time: '', location: '' });
  const [postId, setPostId] = useState(null);

  const { data: myPets = [] } = useQuery({
    queryKey: ['owned_pets', user?.email],
    queryFn: () => base44.entities.OwnedPet.filter({ owner_email: user.email }, 'name', 50),
    enabled: !!user?.email,
  });

  const handlePhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_PHOTOS - photoUrls.length;
    const toUpload = files.slice(0, remaining);
    setUploadingPhoto(true);
    try {
      const uploaded = await Promise.all(
        toUpload.map(file => base44.integrations.Core.UploadFile({ file }).then(r => r.file_url))
      );
      setPhotoUrls(prev => [...prev, ...uploaded]);
    } catch (err) {
      console.error('Photo upload error:', err);
      toast.error('Photo upload failed: ' + (err?.message || err));
    }
    setUploadingPhoto(false);
    e.target.value = '';
  };

  const removePhoto = (idx) => setPhotoUrls(prev => prev.filter((_, i) => i !== idx));

  const handleVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setVideoUrl(file_url);
    } catch (err) {
      console.error('Video upload error:', err);
      toast.error('Video upload failed: ' + (err?.message || err));
    }
    setUploadingVideo(false);
    e.target.value = '';
  };

  const handlePost = async () => {
    setSaving(true);
    try {
    const linkedPet = myPets.find(p => p.id === selectedPetId);
    const payload = {
      author_email: user.email,
      author_name: user.full_name || user.email.split('@')[0],
      content,
      post_type: type,
      pet_name: linkedPet ? linkedPet.name : petName,
      pet_profile_id: selectedPetId || undefined,
      photo_url: photoUrls[0] || '',
      photo_urls: photoUrls,
      video_url: videoUrl || undefined,
      likes: [],
      rsvp_emails: [],
      ...(type === 'event' ? {
        event_title: event.title,
        event_date: event.date,
        event_time: event.time,
        event_location: event.location,
      } : {})
    };
    const post = await base44.entities.Post.create(payload);
    setPostId(post.id);
    setContent(''); setPetName(''); setPhotoUrls([]); setVideoUrl(''); setSelectedPetId(''); setEvent({ title: '', date: '', time: '', location: '' });
    onPosted();
    } catch (err) {
      console.error('Post create error:', err);
      toast.error('Failed to post: ' + (err?.message || err));
    }
    setSaving(false);
  };

  const canAddMorePhotos = photoUrls.length < MAX_PHOTOS;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      {/* Type selector */}
      <div className="flex gap-2 mb-4">
        {TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${type === t.value ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <t.icon className={`w-4 h-4 ${type === t.value ? t.color : ''}`} />
            {t.label}
          </button>
        ))}
      </div>

      {type === 'event' && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="col-span-2">
            <Input value={event.title} onChange={e => setEvent(p => ({ ...p, title: e.target.value }))} placeholder="Event title (e.g. Dog Park Meetup 🐶)" />
          </div>
          <Input type="date" value={event.date} onChange={e => setEvent(p => ({ ...p, date: e.target.value }))} />
          <Input type="time" value={event.time} onChange={e => setEvent(p => ({ ...p, time: e.target.value }))} />
          <div className="col-span-2">
            <Input value={event.location} onChange={e => setEvent(p => ({ ...p, location: e.target.value }))} placeholder="Location (e.g. Riverside Dog Park)" />
          </div>
        </div>
      )}

      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={type === 'event' ? 'Tell people about this event...' : type === 'photo' ? 'Write a caption...' : "Share a story about your pet..."}
        className="mb-3 resize-none h-24"
      />

      {/* Photo previews */}
      {photoUrls.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-3">
          {photoUrls.map((url, idx) => (
            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => removePhoto(idx)} className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5">
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Video preview */}
      {videoUrl && (
        <div className="relative mb-3 rounded-xl overflow-hidden bg-black">
          <video src={videoUrl} controls className="w-full max-h-48 object-contain" />
          <button onClick={() => setVideoUrl('')} className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {myPets.length > 0 ? (
          <div className="flex items-center gap-1.5">
            <PawPrint className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <Select value={selectedPetId} onValueChange={setSelectedPetId}>
              <SelectTrigger className="w-40 h-9 text-sm">
                <SelectValue placeholder="Tag a pet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No pet</SelectItem>
                {myPets.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <Input
            value={petName}
            onChange={e => setPetName(e.target.value)}
            placeholder="Pet's name (optional)"
            className="w-44"
          />
        )}

        {type !== 'event' && (
          <>
            <label className={`flex items-center gap-1.5 cursor-pointer text-sm transition-colors ${canAddMorePhotos ? 'text-slate-500 hover:text-rose-500' : 'text-slate-300 cursor-not-allowed'}`}>
              {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {photoUrls.length > 0 ? `Photos (${photoUrls.length}/${MAX_PHOTOS})` : 'Add photos'}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={!canAddMorePhotos}
                onChange={handlePhotos}
              />
            </label>

            {!videoUrl && (
              <label className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-500 hover:text-violet-500 transition-colors">
                {uploadingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                Add video
                <input type="file" accept="video/*" className="hidden" onChange={handleVideo} />
              </label>
            )}
          </>
        )}

        <Button
          onClick={handlePost}
          disabled={saving || !content.trim()}
          className="ml-auto rounded-xl hover:opacity-90"
          style={{ backgroundColor: '#b1511d' }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          Post
        </Button>
      </div>

      {postId && (
        <OrganizationTagger
          postId={postId}
          contentType="post"
          onTagged={() => setPostId(null)}
        />
      )}
    </div>
  );
}
