'use client';

import React, { useEffect, useState } from 'react';
import { Scale, RefreshCw, Search, LoaderCircle as Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export default function LawyerRegistryPage() {
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [lRes, aRes] = await Promise.all([fetch('/api/lawyers'), fetch('/api/auth/me')]);
      const lData = await lRes.json();
      const aData = await aRes.json();
      if (!lRes.ok) throw new Error(lData.message || lData.error || 'Failed to load lawyers');
      setLawyers(lData.lawyers || []);
      if (aData.authenticated) setUser(aData.user);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const q = search.trim().toLowerCase();
  const rows = lawyers.filter(
    (l) =>
      !q ||
      l.full_name?.toLowerCase().includes(q) ||
      l.bar_registration_number?.toLowerCase().includes(q) ||
      l.specialization?.toLowerCase().includes(q)
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Lawyer Registry"
          subtitle="Enrolled advocates with live workload from SQL view v_lawyer_workload_metrics"
          user={user}
          actions={
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          }
        />

        <main className="p-6 space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, bar number or specialization"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-10 flex items-center justify-center text-slate-500 text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading registry...
              </div>
            ) : rows.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">No lawyers found.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Advocate</th>
                    <th className="py-3 px-4">Bar Registration</th>
                    <th className="py-3 px-4">Specialization</th>
                    <th className="py-3 px-4">Experience</th>
                    <th className="py-3 px-4">Active Cases</th>
                    <th className="py-3 px-4">Capacity Used</th>
                    <th className="py-3 px-4">Pending Hearings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((l) => {
                    const pct = Math.min(100, Number(l.capacity_utilization_pct) || 0);
                    return (
                      <tr key={l.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Scale className="w-4 h-4 text-amber-600" />
                            <div>
                              <p className="font-semibold text-slate-900">{l.full_name}</p>
                              <p className="text-xs text-slate-500">{l.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-700">{l.bar_registration_number}</td>
                        <td className="py-3 px-4 text-slate-700">{l.specialization}</td>
                        <td className="py-3 px-4 text-slate-700">{l.years_experience} yrs</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {l.active_cases_count} / {l.max_case_capacity}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-600">{pct}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{l.pending_hearings_count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
