import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

interface TeaDrop {
  _id: string;
  faqId: string;
  faqQuestion: string;
  read: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function SpillTheTea() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [drops, setDrops] = useState<TeaDrop[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch tea feed
  const fetchTea = useCallback(async (pageNum = 1, reset = false) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get<{
        drops: TeaDrop[];
        hasMore: boolean;
        unreadCount: number;
      }>(`/notifications/tea?page=${pageNum}&limit=20`);
      setDrops((prev) => (reset ? res.data.drops : [...prev, ...res.data.drops]));
      setUnread(res.data.unreadCount);
      setHasMore(res.data.hasMore);
      setPage(pageNum);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Poll for new drops every 30s when dropdown is open
  useEffect(() => {
    if (open) {
      fetchTea(1, true);
      pollingRef.current = setInterval(() => fetchTea(1, true), 30_000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [open, fetchTea]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/tea/read-all');
      setDrops((prev) => prev.map((d) => ({ ...d, read: true })));
      setUnread(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await api.patch(`/notifications/tea/${id}/read`);
      setDrops((prev) => prev.map((d) => (d._id === id ? { ...d, read: true } : d)));
      setUnread((u) => Math.max(0, u - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDropClick = (drop: TeaDrop) => {
    if (!drop.read) handleMarkOneRead(drop._id);
    // Navigate to the FAQ page with this question highlighted
    window.location.href = `/faq?q=${encodeURIComponent(drop.faqQuestion)}`;
  };

  if (!user) return null;

  const freshLabel = (drop: TeaDrop, index: number) =>
    !drop.read && index === 0 ? 'fresh tea ☕' : 'tea';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-black/[0.04] transition-colors"
        aria-label="Spill the Tea"
        title="Spill the Tea ☕"
      >
        <span className="text-lg" style={{ fontSize: '1.15rem' }}>☕</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-accent text-white text-[9px] font-bold px-1 leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-border shadow-float z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="text-base">☕</span>
              <span className="text-sm font-semibold text-ink">Spill the Tea</span>
              {unread > 0 && (
                <span className="text-[10px] font-semibold text-accent bg-accent-light px-2 py-0.5 rounded-full">
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-ink-faint hover:text-ink transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Drop list */}
          <div className="max-h-80 overflow-y-auto">
            {loading && drops.length === 0 ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-mist animate-pulse" />
                ))}
              </div>
            ) : drops.length === 0 ? (
              <div className="flex flex-col items-center py-10 px-4 text-center">
                <span className="text-2xl mb-2">👀</span>
                <p className="text-sm font-medium text-ink-soft">No tea yet</p>
                <p className="text-xs text-ink-faint mt-1">New FAQs will appear here as drops</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {drops.map((drop, idx) => (
                  <button
                    key={drop._id}
                    onClick={() => handleDropClick(drop)}
                    className={`w-full text-left px-4 py-3 hover:bg-mist/50 transition-colors ${
                      !drop.read ? 'bg-accent-light/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        !drop.read && idx === 0
                          ? 'bg-accent text-white'
                          : 'bg-mist text-ink-faint'
                      }`}>
                        {idx === 0 && !drop.read ? '☕' : '🍵'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                            !drop.read && idx === 0 ? 'text-accent' : 'text-ink-faint'
                          }`}>
                            {freshLabel(drop, idx)}
                          </span>
                          <span className="text-[10px] text-ink-faint">·</span>
                          <span className="text-[10px] text-ink-faint">{timeAgo(drop.createdAt)}</span>
                        </div>
                        <p className="text-xs text-ink leading-snug line-clamp-2">{drop.faqQuestion}</p>
                      </div>
                      {!drop.read && (
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent mt-1" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Load more */}
          {hasMore && (
            <button
              onClick={() => fetchTea(page + 1)}
              className="w-full px-4 py-2.5 text-xs font-medium text-ink-faint hover:text-ink hover:bg-mist/30 transition-colors border-t border-border/40"
            >
              {loading ? 'Loading…' : 'Load more tea →'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}