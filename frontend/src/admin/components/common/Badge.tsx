import React from 'react';

type BadgeVariant = 'approved' | 'pending' | 'rejected' | 'admin' | 'user' | 'moderator' | 'default';

interface BadgeProps {
  status?: BadgeVariant;
  label?: string;
  showDot?: boolean;
}

const STYLES: Record<BadgeVariant, { bg: string; text: string; border: string; dot: string }> = {
  approved:  { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0', dot: '#22c55e' },
  pending:   { bg: '#fffbeb', text: '#92400e', border: '#fde68a', dot: '#f59e0b' },
  rejected:  { bg: '#fef2f2', text: '#991b1b', border: '#fecaca', dot: '#ef4444' },
  admin:     { bg: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe', dot: '#7c3aed' },
  user:      { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', dot: '#3b82f6' },
  moderator: { bg: '#ecfeff', text: '#155e75', border: '#a5f3fc', dot: '#06b6d4' },
  default:   { bg: '#f9fafb', text: '#374151', border: '#e5e7eb', dot: '#6b7280' },
};

export default function Badge({ status = 'default', label, showDot = true }: BadgeProps) {
  const s = STYLES[status] || STYLES.default;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}>
      {showDot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />}
      {label || status}
    </span>
  );
}
