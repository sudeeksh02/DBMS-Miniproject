'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Calendar,
  MessageSquare,
  FileText,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  Scale,
  UserCheck,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge';

export default function LawyerDashboardPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [hearings, setHearings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [casesRes, hearingsRes] = await Promise.all([
        fetch('/api/cases'),
        fetch('/api/hearings?upcoming=true'),
      ]);
      const casesData = await casesRes.json();
      const hearingsData = await hearingsRes.json();
      setCases(casesData.cases || []);
      setHearings(hearingsData.hearings || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Legal Counsel Workstation"
          subtitle="Manage assigned matrimonial cases, court appearances, and client affidavits"
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <Link
                href="/cases/new"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Case Petition</span>
              </Link>
            </div>
          }
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Lawyer Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Assigned Cases"
              value={cases.length}
              subtitle="Active counsel representations"
              icon={Briefcase}
              iconColor="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard
              title="Upcoming Hearings"
              value={hearings.length}
              subtitle="Next appearances on docket"
              icon={Calendar}
              iconColor="text-purple-600"
              bgColor="bg-purple-50"
            />
            <StatCard
              title="Workload Status"
              value={`${cases.length} / 15`}
              subtitle="Capacity within safe operational threshold"
              icon={UserCheck}
              iconColor="text-emerald-600"
              bgColor="bg-emerald-50"
              trend="Optimal Workload"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Assigned Cases List */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Assigned Divorce Cases</h3>
                  <p className="text-xs text-slate-500">Petitions under your active legal representation</p>
                </div>
                <Link href="/cases" className="text-xs font-semibold text-blue-600 hover:underline">
                  View All &rarr;
                </Link>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading case records...</div>
              ) : cases.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No cases currently assigned.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cases.slice(0, 5).map((c) => (
                    <div key={c.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors px-2 rounded-xl">
                      <div className="min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {c.reference_number}
                          </span>
                          <StatusBadge status={c.status} />
                          <PriorityBadge priority={c.priority} />
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 truncate">{c.case_title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Petitioner: <strong className="text-slate-700">{c.petitioner_name || 'N/A'}</strong> &bull; Respondent: <strong className="text-slate-700">{c.respondent_name || 'N/A'}</strong>
                        </p>
                      </div>

                      <Link
                        href={`/cases/${c.id}`}
                        className="shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      >
                        <span>Workstation</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Hearings Docket */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Court Hearing Calendar</h3>
                  <p className="text-xs text-slate-500">Appearance dates</p>
                </div>
                <Link href="/hearings" className="text-xs font-semibold text-blue-600 hover:underline">
                  Calendar &rarr;
                </Link>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading hearings...</div>
              ) : hearings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No scheduled appearances.</div>
              ) : (
                <div className="space-y-3">
                  {hearings.slice(0, 4).map((h) => (
                    <div key={h.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 truncate">{h.case_title}</span>
                        <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                          {h.court_room}
                        </span>
                      </div>
                      <p className="text-slate-600 font-medium">
                        {new Date(h.hearing_date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">Presiding: {h.judge_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
