'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Users,
  Calendar,
  Shield,
  ArrowRight,
  RefreshCw,
  Plus,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export default function CustodyPage() {
  const [arrangements, setArrangements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const fetchCustody = async () => {
    setLoading(true);
    try {
      const [custRes, authRes] = await Promise.all([
        fetch('/api/custody'),
        fetch('/api/auth/me'),
      ]);
      const cData = await custRes.json();
      const aData = await authRes.json();

      setArrangements(cData.arrangements || []);
      if (aData.authenticated) setUser(aData.user);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustody();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Child Custody & Guardianship Registry"
          subtitle="Legal custody arrangements, parental visitation protocols, and child support maintenance"
          user={user}
          actions={
            <button
              onClick={fetchCustody}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          }
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading custody arrangements...</div>
          ) : arrangements.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Heart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-700">No Custody Arrangements On Record</h4>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {arrangements.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {a.reference_number}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base mt-1.5">{a.case_title}</h3>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        a.is_agreed
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {a.is_agreed ? 'Mutually Agreed' : 'Contested Stance'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 my-4">
                      <div className="p-3 bg-slate-50 rounded-xl text-xs">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Type</span>
                        <strong className="text-slate-900 block mt-0.5">{a.custody_type.replace(/_/g, ' ')}</strong>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl text-xs">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Children</span>
                        <strong className="text-slate-900 block mt-0.5">{a.number_of_children} Minor(s)</strong>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl text-xs">
                        <span className="text-emerald-700 block text-[10px] uppercase font-semibold">Monthly Support</span>
                        <strong className="text-emerald-900 block mt-0.5">₹{Number(a.monthly_support_amount).toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-500 font-bold block mb-0.5">Children Particulars:</span>
                        <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">{a.children_details || 'Unspecified'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold block mb-0.5">Visitation Protocol:</span>
                        <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">{a.visitation_schedule || 'Unspecified'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
                    <Link
                      href={`/cases/${a.case_id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                    >
                      <span>Open Case Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
