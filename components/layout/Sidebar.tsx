'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Scale,
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  FileText,
  DollarSign,
  Heart,
  BarChart3,
  Search,
  Settings,
  LogOut,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: 'ADMIN' | 'LAWYER' | 'CLIENT';
  } | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const getDashboardHref = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'LAWYER') return '/lawyer/dashboard';
    return '/client/dashboard';
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: getDashboardHref(),
      icon: LayoutDashboard,
      active: pathname.includes('/dashboard'),
      roles: ['ADMIN', 'LAWYER', 'CLIENT'],
    },
    {
      label: 'Divorce Cases',
      href: '/cases',
      icon: Briefcase,
      active: pathname.startsWith('/cases'),
      roles: ['ADMIN', 'LAWYER', 'CLIENT'],
    },
    {
      label: 'Lawyer Registry',
      href: '/lawyers',
      icon: Users,
      active: pathname.startsWith('/lawyers'),
      roles: ['ADMIN', 'LAWYER'],
    },
    {
      label: 'Court Hearings',
      href: '/hearings',
      icon: Calendar,
      active: pathname.startsWith('/hearings'),
      roles: ['ADMIN', 'LAWYER', 'CLIENT'],
    },
    {
      label: 'Document Vault',
      href: '/documents',
      icon: FileText,
      active: pathname.startsWith('/documents'),
      roles: ['ADMIN', 'LAWYER', 'CLIENT'],
    },
    {
      label: 'Settlements & Alimony',
      href: '/settlements',
      icon: DollarSign,
      active: pathname.startsWith('/settlements'),
      roles: ['ADMIN', 'LAWYER', 'CLIENT'],
    },
    {
      label: 'Child Custody',
      href: '/custody',
      icon: Heart,
      active: pathname.startsWith('/custody'),
      roles: ['ADMIN', 'LAWYER', 'CLIENT'],
    },
    {
      label: 'Reports & Analytics',
      href: '/analytics',
      icon: BarChart3,
      active: pathname.startsWith('/analytics'),
      roles: ['ADMIN', 'LAWYER'],
    },
    {
      label: 'Legal Assistant (pgvector)',
      href: '/semantic-search',
      icon: Search,
      active: pathname.startsWith('/semantic-search'),
      roles: ['ADMIN', 'LAWYER', 'CLIENT'],
    },
    {
      label: 'User Management',
      href: '/users',
      icon: ShieldAlert,
      active: pathname.startsWith('/users'),
      roles: ['ADMIN'],
    },
    {
      label: 'System & Architecture',
      href: '/settings',
      icon: Settings,
      active: pathname.startsWith('/settings'),
      roles: ['ADMIN', 'LAWYER', 'CLIENT'],
    },
  ];

  const filteredNavItems = navItems.filter(item => !user || item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-[#0B132B] text-slate-300 flex flex-col shrink-0 border-r border-slate-800 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/10 group-hover:scale-105 transition-transform">
            <Scale className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-none flex items-center gap-1.5">
              DivorceMS
              <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                DBMS L3
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 mt-1">Legal Case Platform</p>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Workstation
        </div>
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                item.active
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${item.active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.active && <ChevronRight className="w-4 h-4 text-white/70" />}
            </Link>
          );
        })}
      </div>

      {/* User Footer */}
      {user && (
        <div className="p-4 border-t border-slate-800/80 bg-[#0F172A]/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-amber-400 shrink-0 border border-slate-600">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 truncate">
                <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
                <span className="inline-block text-[10px] font-medium text-amber-400 uppercase tracking-wider bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                  {user.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
