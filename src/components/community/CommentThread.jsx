import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MoreVertical, Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CommentThread({ postId, currentUser, allUsers = [] }) {
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const queryClient = useQueryClient();
  const inputRef = useRef(null);

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => base44.entities.Comment.filter({ post_id: postId }, 'created_date', 100),
  });

  const topLevelComments = comments.filter(c => !c.parent_comment_id);

  const getReplies = (commentId) => comments.filter(c => c.parent_comment_id === commentId);

  const handleMentionType = (text) => {
    setCommentText(text);
    const lastWord = text.split(/\s+/).pop();
    if (lastWord.startsWith('@')) {
      setMentionQuery(lastWord.slice(1).toLowerCase());
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const handleAddMention = (user) => {
    const words = commentText.split(/\s+/);
    words.pop();
    const newText = [...words, `@${user.full_name}`].join(' ') + ' ';
    setCommentText(newText);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const filteredUsers = allUsers.filter(u =>
    u.email !== currentUser?.email &&
    u.full_name.toLowerCase().includes(mentionQuery)
  );

  const handleComment = async () => {
    if (!commentText.trim() || !currentUser) return;
    setSubmitting(true);

    const mentionedEmails = (commentText.match(/@\w+/g) || []).map(m => {
      const name = m.slice(1);
      const user = allUsers.find(u => u.full_name === name);
      return user?.email;
    }).filter(Boolean);

    await base44.entities.Comment.create({
      post_id: postId,
      parent_comment_id: replyingTo,
      author_email: currentUser.email,
      author_name: currentUser.full_name || currentUser.email.split('@')[0],
      content: commentText.trim(),
      mentioned_emails: mentionedEmails,
    });

    setCommentText('');
    setReplyingTo(null);
    setSubmitting(false);
    queryClient.invalidateQueries({ queryKey: ['comments', postId] });
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    await base44.entities.Comment.delete(commentId);
    queryClient.invalidateQueries({ queryKey: ['comments', postId] });
  };

  const renderComment = (comment, isReply = false) => {
    const initials = (comment.author_name || 'U')[0].toUpperCase();
    const isOwner = comment.author_email === currentUser?.email;

    return (
      <div key={comment.id} className={`flex gap-2 ${isReply ? 'ml-8 mt-2' : ''}`}>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div>
              <span className="font-semibold text-xs text-slate-700">{comment.author_name}</span>
              <span className="text-xs text-slate-400 ml-2">{formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}</span>
            </div>
            {isOwner && (
              <button onClick={() => handleDeleteComment(comment.id)} className="p-1 hover:bg-slate-200 rounded transition-colors">
                <MoreVertical className="w-3 h-3" style={{ color: '#b1511d' }} />
              </button>
            )}
          </div>
          <p className="text-sm text-slate-600">{comment.content}</p>
          <button onClick={() => setReplyingTo(comment.id)} className="text-xs mt-1.5 flex items-center gap-1 hover:opacity-70" style={{ color: '#b1511d' }}>
            <Reply className="w-3 h-3" /> Reply
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {topLevelComments.map(comment => (
        <div key={comment.id}>
          {renderComment(comment)}
          {getReplies(comment.id).map(reply => renderComment(reply, true))}
        </div>
      ))}

      {/* Comment Input */}
      <div className="relative">
        {replyingTo && (
          <div className="text-xs text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Replying to comment</span>
            <button onClick={() => setReplyingTo(null)} className="hover:opacity-70" style={{ color: '#b1511d' }}>✕</button>
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={commentText}
              onChange={e => handleMentionType(e.target.value)}
              placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
              className="rounded-xl text-sm"
              onKeyDown={e => e.key === 'Enter' && handleComment()}
            />
            {showMentions && filteredUsers.length > 0 && (
              <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto z-10">
                {filteredUsers.map(user => (
                  <button
                    key={user.email}
                    onClick={() => handleAddMention(user)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 text-xs text-slate-600 flex items-center gap-2 border-b border-slate-100 last:border-0"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-300 to-violet-300 flex items-center justify-center text-white text-xs font-bold">
                      {user.full_name[0]}
                    </div>
                    {user.full_name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button size="icon" onClick={handleComment} disabled={submitting || !commentText.trim()} className="rounded-xl hover:opacity-90 flex-shrink-0" style={{ backgroundColor: '#b1511d' }}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}