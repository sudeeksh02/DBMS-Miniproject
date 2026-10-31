'use client';

import React from 'react';
import Link from 'next/link';
import { Database, Search, Bell, Shield } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  user?: {
    id: string;
    fullName: string;
    role: string;
  } | null;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, user, actions }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-3">
        {/* Quick Link to Semantic Search */}
        <Link
          href="/semantic-search"
          className="hidden md:flex items-center space-x-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span>Semantic Search (pgvector)</span>
        </Link>

        {/* Database Status Pills */}
        <div className="hidden lg:flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] text-slate-600">
          <Database className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-semibold text-slate-800">PostgreSQL 3NF</span>
          <span className="text-slate-300">|</span>
          <span className="font-semibold text-emerald-700">MongoDB</span>
          <span className="text-slate-300">|</span>
          <span className="font-semibold text-purple-700">pgvector</span>
        </div>

        {/* User Role Badge */}
        {user && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
            <Shield className="w-3 h-3 text-amber-600" />
            {user.role}
          </span>
        )}

        {/* Custom Page Actions (e.g. "Register Case", "Schedule Hearing", etc.) */}
        {actions}
      </div>
    </header>
  );
}
