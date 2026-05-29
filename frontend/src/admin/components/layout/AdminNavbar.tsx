import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';

const PAGE_LABELS: Record<string, string> = {
  '/admin':          'Dashboard',
  '/admin/faqs':     'FAQs',
  '/admin/community': 'Community',
  '/admin/users':     'Users',
  '/admin/settings':  'Settings',
};

interface AdminNavbarProps { onMobileMenuToggle: () => void; }

export default function AdminNavbar({ onMobileMenuToggle }: AdminNavbarProps) {
  const location = useLocation();
  const { user } = useAdminAuth();
  const label = PAGE_LABELS[location.pathname] ?? 'Admin';

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-5 shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button onClick={onMobileMenuToggle}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <h1 className="text-sm font-light text-gray-500 tracking-wide">{label}</h1>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
          {user?.name?.[0]?.toUpperCase() ?? 'A'}
        </div>
        <div className="hidden sm:block">
          <p className="text-xs font-medium text-gray-800 leading-none">{user?.name}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-none">{user?.role}</p>
        </div>
      </div>
    </header>
  );
}
