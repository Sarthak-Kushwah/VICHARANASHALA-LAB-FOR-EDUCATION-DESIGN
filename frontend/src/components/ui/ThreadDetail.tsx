import React, { useEffect, useState, useCallback } from 'react';
import api from '../../utils/api';
import Avatar from './Avatar';
import Badge from './Badge';
import Button from './Button';
import { useAuth } from '../../hooks/useAuth';

export interface Comment {
  _id: string;
  author?: { name?: string; _id?: string };
  body: string;
  createdAt?: string;
  upvotes?: (string | { _id?: string })[];
  downvotes?: (string | { _id?: string })[];
  verified?: boolean;
  isExpertAnswer?: boolean;
  depth: number;
  parentId?: string | null;
  replies?: Comment[];
}

export interface ThreadPost {
  _id: string;
  title: string;
  body?: string;
  status?: 'answered' | 'unanswered' | string;
  author?: { name?: string; _id?: string };
  createdAt?: string;
  upvotes?: (string | { _id?: string })[];
  comments?: Comment[];
  answer?: string | null;
  answerIsExpert?: boolean;
  [key: string]: unknown;
}

interface ThreadDetailProps {
  postId: string;
  onClose: () => void;
}

const formatDate = (d: string | undefined) =>
  new Date(d ?? Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

// ─── Comment Node (recursive) ───────────────────────────────────────────────────

interface CommentNodeProps {
  comment: Comment;
  postId: string;
  currentUserId: string;
  userRole: string;
  onReplyAdded: (newComment: Comment, parentId: string | null) => void;
  depth?: number;
}

function CommentNode({
  comment,
  postId,
  currentUserId,
  userRole,
  onReplyAdded,
  depth = 0,
}: CommentNodeProps) {
  const [replyText, setReplyText] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [localReplies, setLocalReplies] = useState<Comment[]>(comment.replies ?? []);

  const cUpvotes = comment.upvotes?.length ?? 0;
  const cDownvotes = comment.downvotes?.length ?? 0;
  const netScore = cUpvotes - cDownvotes;
  const hasUpvoted = comment.upvotes?.some(
    (u) => (typeof u === 'object' ? (u as { _id?: string })._id || u : u)?.toString() === currentUserId
  );
  const hasDownvoted = comment.downvotes?.some(
    (u) => (typeof u === 'object' ? (u as { _id?: string })._id || u : u)?.toString() === currentUserId
  );
  const commentOpacity = netScore >= 0 ? 1 : Math.max(0.15, 1 - Math.abs(netScore) * 0.2);
  const maxDepth = depth >= 3;

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || replyLoading) return;
    setReplyLoading(true);
    try {
      const res = await api.post<{ comment: Comment }>(
        `/community/${postId}/comments?parentId=${comment._id}`,
        { body: replyText }
      );
      setLocalReplies((prev) => [...prev, res.data.comment]);
      setReplyText('');
      setShowReplyBox(false);
      onReplyAdded(res.data.comment, comment._id);
    } catch (e) {
      console.error(e);
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div
      id={`comment-${comment._id}`}
      className="flex items-start gap-2.5 transition-opacity duration-300 relative"
      style={{ opacity: commentOpacity }}
    >
      <Avatar name={comment.author?.name} size="sm" />

      <div
        className={`flex-1 rounded-xl px-3 py-2.5 relative overflow-hidden ${
          comment.isExpertAnswer ? 'bg-accent/5 border border-accent/20' : 'bg-mist'
        }`}
      >
        {netScore > 2 && <div className="comment-fire-glow" />}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-medium text-ink">{comment.author?.name || 'User'}</span>
            {comment.isExpertAnswer && <Badge variant="accent">👑 Expert</Badge>}
            {comment.verified && <span className="verified-badge">✅ Verified</span>}
            <span className="text-xs text-ink-faint">{formatDate(comment.createdAt)}</span>
            {depth > 0 && (
              <span className="text-[10px] text-ink-faint ml-1">
                ↳ {depth === 1 ? 'reply' : depth === 2 ? 'thread' : 'deep'}
              </span>
            )}
          </div>
          <p className="text-sm text-ink/75 leading-relaxed">{comment.body}</p>

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() =>
                api.post<{ upvotedByMe: boolean }>(`/community/${postId}/comments/${comment._id}/upvote`)
                  .then((res) => {
                    comment.upvotes = res.data.upvotedByMe
                      ? [...(comment.upvotes ?? []), currentUserId]
                      : (comment.upvotes ?? []).filter(
                          (u) =>
                            (typeof u === 'object' ? (u as { _id?: string })._id || u : u)?.toString() !== currentUserId
                        );
                  })
                  .catch(console.error)
              }
              className={`comment-vote-btn ${hasUpvoted ? 'upvoted' : ''}`}
              title="Upvote"
            >
              <span className="emoji-upvote">{hasUpvoted ? '🔥' : '🤌'}</span>
              {cUpvotes > 0 && <span className="text-xs font-semibold">{cUpvotes}</span>}
            </button>

            <button
              onClick={() =>
                api.post<{ deleted?: boolean; downvotedByMe: boolean }>(
                  `/community/${postId}/comments/${comment._id}/downvote`
                ).then((res) => {
                  if (res.data.deleted) {
                    try { new Audio('/fahhhhh.mp3').play(); } catch (_) {}
                    const el = document.getElementById(`comment-${comment._id}`);
                    if (el) { el.style.setProperty('--current-opacity', String(commentOpacity)); el.classList.add('comment-dying'); }
                  }
                }).catch(console.error)
              }
              className={`comment-vote-btn ${hasDownvoted ? 'downvoted' : ''}`}
              title="Downvote"
            >
              <span className="emoji-downvote">🥀</span>
              {cDownvotes > 0 && <span className="text-xs font-semibold">{cDownvotes}</span>}
            </button>

            {netScore < 0 && (
              <span className="text-[10px] text-ink-faint ml-1 melting-text">🧊 melting...</span>
            )}

            {!maxDepth && (
              <button
                onClick={() => setShowReplyBox((v) => !v)}
                className="text-[10px] text-ink-faint hover:text-accent transition-colors ml-1"
              >
                {showReplyBox ? 'Cancel' : '↩ Reply'}
              </button>
            )}

            {(userRole === 'admin' || userRole === 'moderator') && (
              <button
                onClick={() =>
                  api.patch<{ verified: boolean }>(`/community/${postId}/comments/${comment._id}/verify`)
                    .then((res) => { comment.verified = res.data.verified; })
                    .catch(console.error)
                }
                className="ml-auto text-[10px] text-ink-faint hover:text-accent transition-colors"
              >
                {comment.verified ? 'Unverify' : '✅ Verify'}
              </button>
            )}
          </div>

          {showReplyBox && (
            <form onSubmit={handleReply} className="mt-2 flex gap-1.5 items-start">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                placeholder={`Reply to ${comment.author?.name || 'user'}…`}
                className="flex-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 resize-none"
                autoFocus
              />
              <Button type="submit" size="sm" disabled={!replyText.trim()} loading={replyLoading} className="flex-shrink-0 mt-0.5">
                Reply
              </Button>
            </form>
          )}
        </div>
      </div>

      {localReplies.length > 0 && (
        <div className="flex-1 pl-3 border-l-2 border-border/30 ml-2 space-y-2 mt-1">
          {localReplies.map((reply) => (
            <CommentNode
              key={reply._id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              userRole={userRole}
              onReplyAdded={onReplyAdded}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ThreadDetail Modal ───────────────────────────────────────────────────────

export default function ThreadDetail({ postId, onClose }: ThreadDetailProps) {
  const { user } = useAuth();
  const currentUserId = user?._id ?? '';
  const userRole = user?.role ?? '';

  const [post, setPost] = useState<ThreadPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [upvoteLoading, setUpvoteLoading] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolveText, setResolveText] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);

  const isAnswered = post?.status === 'answered';
  const upvoteCount = post?.upvotes?.length ?? 0;
  const hasUpvoted = post?.upvotes?.some(
    (id) => (typeof id === 'object' ? (id as { _id?: string })._id || id : id)?.toString() === currentUserId
  );
  const canResolve = userRole === 'admin' || userRole === 'moderator' || userRole === 'expert';
  const topLevelComments = post?.comments ?? [];

  useEffect(() => {
    setLoading(true);
    api.get<ThreadPost>(`/community/${postId}`)
      .then((res) => setPost(res.data))
      .catch(() => setError('Failed to load post.'))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleUpvote = async () => {
    if (upvoteLoading || !post) return;
    setUpvoteLoading(true);
    try {
      const res = await api.post<{ upvotedByMe: boolean }>(`/community/${post._id}/upvote`);
      setPost((prev) =>
        prev ? {
          ...prev,
          upvotes: res.data.upvotedByMe
            ? [...(prev.upvotes ?? []), currentUserId]
            : (prev.upvotes ?? []).filter(
                (u) => (typeof u === 'object' ? (u as { _id?: string })._id || u : u)?.toString() !== currentUserId
              ),
        } : prev
      );
    } catch (e) { console.error(e); }
    finally { setUpvoteLoading(false); }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || commentLoading || !post) return;
    setCommentLoading(true);
    try {
      const res = await api.post<{ comment: Comment }>(`/community/${post._id}/comments`, { body: commentText });
      setPost((prev) =>
        prev ? { ...prev, comments: [...(prev.comments ?? []), res.data.comment] } : prev
      );
      setCommentText('');
    } catch (e) { console.error(e); }
    finally { setCommentLoading(false); }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveText.trim() || resolveLoading || !post) return;
    setResolveLoading(true);
    try {
      await api.patch(`/community/${post._id}/resolve`, { answer: resolveText });
      setPost((prev) =>
        prev ? { ...prev, status: 'answered', answer: resolveText.trim() } : prev
      );
      setShowResolveForm(false);
      setResolveText('');
    } catch (e) { console.error(e); }
    finally { setResolveLoading(false); }
  };

  const handleReplyAdded = useCallback((newComment: Comment, parentId: string | null) => {
    if (newComment.depth === 0) {
      setPost((prev) => {
        if (!prev) return prev;
        const exists = (prev.comments ?? []).some((c) => c._id === newComment._id);
        if (exists) return prev;
        return { ...prev, comments: [...(prev.comments ?? []), newComment] };
      });
    }
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-ink/40 backdrop-blur-sm">
        <p className="text-ink-faint">{error || 'Post not found.'}</p>
        <Button variant="secondary" onClick={onClose}>← Back</Button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg bg-card rounded-2xl border border-border shadow-float overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}>
        {/* Sticky header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card flex-shrink-0">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-mist flex items-center justify-center text-ink-soft hover:text-ink hover:bg-border transition-all">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <Badge variant={isAnswered ? 'success' : 'warning'}>
            {isAnswered ? '✓ Answered' : '○ Open'}
          </Badge>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {/* Post */}
          <div className="px-5 py-4">
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5 ${isAnswered ? 'bg-success-light text-success' : 'bg-warning-light text-warning'}`}>
                {isAnswered ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3.5 9L7.5 13L14.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.7"/>
                    <path d="M9 6V10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    <circle cx="9" cy="12.5" r="0.9" fill="currentColor"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-semibold text-ink leading-snug">{post.title}</h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-ink-soft">by {post.author?.name || 'Student'}</span>
                  <span className="text-xs text-ink-faint">·</span>
                  <span className="text-xs text-ink-faint">{formatDate(post.createdAt)}</span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-ink/70 leading-relaxed pl-[3.25rem]">{post.body}</p>
            <div className="flex items-center gap-2 mt-3 pl-[3.25rem]">
              <button
                onClick={handleUpvote}
                disabled={upvoteLoading}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${hasUpvoted ? 'bg-accent text-white' : 'bg-mist text-ink-soft hover:text-ink hover:bg-border'}`}
              >
                <span className="text-sm">{hasUpvoted ? '🔥' : '🤌'}</span>
                {upvoteCount > 0 && <span>{upvoteCount}</span>}
                <span className="text-[10px] opacity-70">{hasUpvoted ? 'Upvoted' : 'Upvote'}</span>
              </button>
            </div>
          </div>

          {/* Official answer */}
          {isAnswered && post.answer && (
            <div className="mx-5 mb-4 bg-success-light/30 border border-success/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-success uppercase tracking-wider">✓ Official Answer</span>
                {post.answerIsExpert && <Badge variant="success">👑 Expert</Badge>}
              </div>
              <p className="text-sm text-ink/80 leading-relaxed">{post.answer}</p>
            </div>
          )}

          {/* Resolve form */}
          {canResolve && !isAnswered && !showResolveForm && (
            <div className="px-5 pb-4">
              <button onClick={() => setShowResolveForm(true)} className="text-xs text-accent hover:text-accent/70 transition-colors">
                ✏️ Write an answer
              </button>
            </div>
          )}
          {showResolveForm && (
            <form onSubmit={handleResolve} className="px-5 pb-4 space-y-2">
              <label className="text-xs font-medium text-ink-soft">Official Answer</label>
              <textarea value={resolveText} onChange={(e) => setResolveText(e.target.value)} rows={3}
                placeholder="Write an official answer…"
                className="w-full rounded-xl border border-border bg-mist px-3 py-2.5 text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:bg-card transition-all resize-none" />
              <div className="flex gap-2">
                <Button type="submit" size="sm" loading={resolveLoading} disabled={!resolveText.trim()}>Save Answer</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowResolveForm(false)}>Cancel</Button>
              </div>
            </form>
          )}

          {/* Comments */}
          <div className="px-5 py-4 border-t border-border/30">
            <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-3">
              Discussion ({topLevelComments.length})
            </h3>
            <div className="divide-y divide-border/30">
              {topLevelComments.length === 0 ? (
                <p className="text-sm text-ink-faint text-center py-6">No comments yet. Be the first to comment!</p>
              ) : (
                topLevelComments.map((comment: Comment) => (
                  <div key={comment._id} className="pt-4 pb-2">
                    <CommentNode
                      comment={comment}
                      postId={post._id}
                      currentUserId={currentUserId}
                      userRole={userRole}
                      onReplyAdded={handleReplyAdded}
                      depth={0}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sticky footer — new comment */}
        <form onSubmit={handleComment} className="px-4 pt-3 pb-5 border-t border-border bg-card flex-shrink-0">
          <div className="flex gap-2 items-start">
            <Avatar name={user?.name} size="sm" />
            <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={2}
              placeholder="Add to the discussion…"
              className="flex-1 rounded-xl border border-border bg-mist px-3 py-2.5 text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-accent/25 focus:bg-card transition-all resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(e); }
              }} />
            <Button type="submit" size="md" disabled={!commentText.trim()} loading={commentLoading} className="flex-shrink-0 mt-0.5">
              Post
            </Button>
          </div>
          <p className="text-xs text-ink-faint mt-1.5 ml-10">Enter to post · Shift+Enter for newline · Esc to close</p>
        </form>
      </div>
    </div>
  );
}