'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ArrowRight,
  Calendar,
  Building,
  User,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatusBadge, PriorityBadge } from '@/components/ui/StatusBadge';

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [user, setUser] = useState<any>(null);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (authData.authenticated) {
        setUser(authData.user);
      }

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);

      const res = await fetch(`/api/cases?${params.toString()}`);
      const data = await res.json();
      setCases(data.cases || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCases();
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Divorce Case Docket"
          subtitle="Registry of matrimonial petitions, hearings, custody arrangements, and settlements"
          user={user}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={fetchCases}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <Link
                href="/cases/new"
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Case</span>
              </Link>
            </div>
          }
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Search & Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[260px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reference number, case title, or litigant name..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              />
            </form>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              >
                <option value="ALL">All Statuses</option>
                <option value="REGISTERED">Registered</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="DOCUMENTATION_PENDING">Documentation Pending</option>
                <option value="MEDIATION">Mediation</option>
                <option value="HEARING_SCHEDULED">Hearing Scheduled</option>
                <option value="SETTLEMENT_NEGOTIATION">Settlement Negotiation</option>
                <option value="AWAITING_FINAL_ORDER">Awaiting Final Order</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>

              <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold ml-2">
                <span>Priority:</span>
              </div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Cases Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading case records from PostgreSQL...</div>
            ) : cases.length === 0 ? (
              <div className="p-12 text-center">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">No Divorce Cases Found</h4>
                <p className="text-xs text-slate-400 mt-1">Try modifying your filter or register a new petition.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Ref Number</th>
                      <th className="py-3 px-4">Case Title & Category</th>
                      <th className="py-3 px-4">Litigant Parties</th>
                      <th className="py-3 px-4">Status & Priority</th>
                      <th className="py-3 px-4">Assigned Counsel</th>
                      <th className="py-3 px-4">Presiding Court</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cases.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">
                          {c.reference_number}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900 truncate max-w-xs">{c.case_title}</p>
                          <span className="text-[11px] text-slate-400">{c.divorce_category}</span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-slate-800">
                            Petitioner: <strong className="text-slate-900">{c.petitioner_name || 'N/A'}</strong>
                          </p>
                          <p className="text-slate-500 text-[11px]">
                            Respondent: {c.respondent_name || 'N/A'}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <StatusBadge status={c.status} />
                            <PriorityBadge priority={c.priority} />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {c.lead_lawyer_name ? (
                            <div>
                              <p className="font-semibold text-slate-800">{c.lead_lawyer_name}</p>
                              <p className="text-[10px] font-mono text-slate-400">{c.lead_lawyer_bar}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {c.presiding_court}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/cases/${c.id}`}
                            className="inline-flex items-center gap-1 font-semibold text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <span>Dossier</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
