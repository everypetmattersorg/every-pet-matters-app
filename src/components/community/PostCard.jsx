import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, CalendarDays, MapPin, Clock, ChevronDown, ChevronUp, UserCheck, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Link } from 'react-router-dom';
import CommentThread from './CommentThread';

const TYPE_COLORS = {
  story: 'bg-violet-100 text-violet-600',
  photo: 'bg-rose-100 text-rose-600',
  event: 'bg-amber-100 text-amber-700',
};

export default function PostCard({ post, currentUser }) {
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.entities.User.list().then(setAllUsers).catch(() => {});
  }, []);

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => base44.entities.Comment.filter({ post_id: post.id }, 'created_date', 100),
    enabled: showComments,
  });

  const isOwner = post.author_email === currentUser?.email;

  const liked = post.likes?.includes(currentUser?.email);
  const rsvpd = post.rsvp_emails?.includes(currentUser?.email);

  const handleLike = async () => {
    if (!currentUser) return;
    const likes = liked
      ? (post.likes || []).filter(e => e !== currentUser.email)
      : [...(post.likes || []), currentUser.email];
    await base44.entities.Post.update(post.id, { likes });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const handleRsvp = async () => {
    if (!currentUser) return;
    const rsvp_emails = rsvpd
      ? (post.rsvp_emails || []).filter(e => e !== currentUser.email)
      : [...(post.rsvp_emails || []), currentUser.email];
    await base44.entities.Post.update(post.id, { rsvp_emails });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const handleEditPost = async () => {
    if (!editContent.trim()) return;
    setSaving(true);
    await base44.entities.Post.update(post.id, { content: editContent.trim() });
    setIsEditing(false);
    setSaving(false);
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const handleDeletePost = async () => {
    if (!confirm('Delete this post?')) return;
    await base44.entities.Post.delete(post.id);
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const initials = (post.author_name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Link to={`/PublicProfile?email=${encodeURIComponent(post.author_email)}`} className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-violet-400 flex items-center justify-center text-white font-bold text-sm hover:opacity-80 transition-opacity">
            {initials}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link to={`/PublicProfile?email=${encodeURIComponent(post.author_email)}`} className="font-semibold text-slate-800 text-sm hover:underline hover:text-[#b1511d] transition-colors">{post.author_name}</Link>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[post.post_type]}`}>
              {post.post_type === 'event' ? '📅 Event' : post.post_type === 'photo' ? '📷 Photo' : '📖 Story'}
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            {post.pet_name && (
              <span className={`font-medium ${post.pet_profile_id ? 'text-rose-500' : 'text-rose-400'}`}>
                🐾 {post.pet_name} ·{' '}
              </span>
            )}
            {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
          </p>
        </div>
        {isOwner && (
          <div className="relative group">
            <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <MoreVertical className="w-4 h-4 text-slate-400" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg hidden group-hover:block z-20">
              <button onClick={() => setIsEditing(true)} className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-50" style={{ color: '#b1511d' }}>
                <Edit2 className="w-3 h-3" /> Edit
              </button>
              <button onClick={handleDeletePost} className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 border-t">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Event Details */}
      {post.post_type === 'event' && post.event_title && (
        <div className="mx-4 mb-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
          <h3 className="font-bold text-slate-800 mb-2">{post.event_title}</h3>
          <div className="space-y-1">
            {post.event_date && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CalendarDays className="w-3.5 h-3.5 text-amber-500" />
                {format(new Date(post.event_date), 'EEEE, MMMM d, yyyy')}
                {post.event_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.event_time}</span>}
              </div>
            )}
            {post.event_location && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                {post.event_location}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {isEditing ? (
        <div className="px-4 pb-3 space-y-2">
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-rose-500"
            rows="3"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleEditPost} disabled={saving} style={{ backgroundColor: '#b1511d' }} className="hover:opacity-90">
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        post.content && <p className="px-4 pb-3 text-slate-700 text-sm leading-relaxed">{post.content}</p>
      )}

      {/* Photo */}
      {post.photo_url && (
        <div className="mx-4 mb-3 rounded-xl overflow-hidden">
          <img src={post.photo_url} alt="Post" className="w-full object-cover max-h-80" />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-3 flex items-center gap-1 border-t border-slate-50 pt-3">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-colors ${liked ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
          {post.likes?.length || 0}
        </button>

        <button
          onClick={() => setShowComments(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-slate-400 hover:bg-slate-50 transition-colors"
          style={{ color: showComments ? '#b1511d' : undefined }}
        >
          <MessageCircle className="w-4 h-4" />
          {comments.length > 0 ? comments.length : ''}
          {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {post.post_type === 'event' && (
          <button
            onClick={handleRsvp}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm ml-auto transition-colors ${rsvpd ? 'bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}
            style={{ color: rsvpd ? '#059669' : undefined }}
          >
            <UserCheck className="w-4 h-4" />
            {rsvpd ? 'Going ✓' : 'RSVP'}
            {post.rsvp_emails?.length > 0 && <span className="text-xs">({post.rsvp_emails.length})</span>}
          </button>
        )}
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-slate-50 px-4 py-3">
          <CommentThread postId={post.id} currentUser={currentUser} allUsers={allUsers} />
        </div>
      )}
    </div>
  );
}