import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, CalendarDays, FileText, Loader2, X, PawPrint } from 'lucide-react';
import OrganizationTagger from './OrganizationTagger';

const TYPES = [
  { value: 'story', label: 'Story', icon: FileText, color: 'text-violet-500' },
  { value: 'photo', label: 'Photo', icon: Camera, color: 'text-rose-500' },
  { value: 'event', label: 'Event', icon: CalendarDays, color: 'text-amber-500' },
];

export default function PostComposer({ user, onPosted }) {
  const [type, setType] = useState('story');
  const [content, setContent] = useState('');
  const [petName, setPetName] = useState('');
  const [selectedPetId, setSelectedPetId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState({ title: '', date: '', time: '', location: '' });
  const [postId, setPostId] = useState(null);

  const { data: myPets = [] } = useQuery({
    queryKey: ['owned_pets', user?.email],
    queryFn: () => base44.entities.OwnedPet.filter({ owner_email: user.email }, 'name', 50),
    enabled: !!user?.email,
  });

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPhotoUrl(file_url);
    setUploading(false);
  };

  const handlePost = async () => {
    setSaving(true);
    const linkedPet = myPets.find(p => p.id === selectedPetId);
    const payload = {
      author_email: user.email,
      author_name: user.full_name || user.email.split('@')[0],
      content,
      post_type: type,
      pet_name: linkedPet ? linkedPet.name : petName,
      pet_profile_id: selectedPetId || undefined,
      photo_url: photoUrl,
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
    setContent(''); setPetName(''); setPhotoUrl(''); setSelectedPetId(''); setEvent({ title: '', date: '', time: '', location: '' });
    setSaving(false);
    onPosted();
  };

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
          <label className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-500 hover:text-rose-500 transition-colors">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {photoUrl ? 'Change photo' : 'Add photo'}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
        )}

        {photoUrl && (
          <div className="relative w-12 h-12 rounded-lg overflow-hidden">
            <img src={photoUrl} alt="" className="w-full h-full object-cover" />
            <button onClick={() => setPhotoUrl('')} className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5">
              <X className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
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
          onTagged={() => {
            setPostId(null);
          }}
        />
      )}
    </div>
  );
}