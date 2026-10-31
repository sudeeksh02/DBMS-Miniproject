'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatCard, Modal } from '@/components/ui/StatCard';

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payRef, setPayRef] = useState('');
  const [recording, setRecording] = useState(false);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const [settleRes, authRes] = await Promise.all([
        fetch('/api/settlements'),
        fetch('/api/auth/me'),
      ]);
      const sData = await settleRes.json();
      const aData = await authRes.json();

      setSettlements(sData.settlements || []);
      if (aData.authenticated) setUser(aData.user);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSettlement) return;
    setRecording(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settlementId: selectedSettlement.id,
          amountPaid: payAmount,
          paymentMethod: payMethod,
          transactionReference: payRef,
        }),
      });

      if (res.ok) {
        setModalOpen(false);
        setPayAmount('');
        setPayRef('');
        fetchSettlements();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to record payment');
      }
    } finally {
      setRecording(false);
    }
  };

  const totalAgreed = settlements.reduce((acc, s) => acc + Number(s.total_agreed_amount || 0), 0);
  const totalPaid = settlements.reduce((acc, s) => acc + Number(s.total_amount_paid || 0), 0);
  const totalOutstanding = totalAgreed - totalPaid;
  const recoveryPct = totalAgreed > 0 ? ((totalPaid / totalAgreed) * 100).toFixed(1) : 0;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Financial Settlements & Alimony Ledger"
          subtitle="Monetary restitution, child support payments, and judicial compliance tracking"
          user={user}
          actions={
            <button
              onClick={fetchSettlements}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          }
        />

        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard
              title="Total Agreed Sum"
              value={`₹${(totalAgreed / 100000).toFixed(1)}L`}
              subtitle={`${settlements.length} total agreements formulated`}
              icon={DollarSign}
              iconColor="text-amber-600"
              bgColor="bg-amber-50"
            />
            <StatCard
              title="Disbursed & Verified"
              value={`₹${(totalPaid / 100000).toFixed(1)}L`}
              subtitle="Confirmed judicial deposits"
              icon={CheckCircle2}
              iconColor="text-emerald-600"
              bgColor="bg-emerald-50"
              trend={`${recoveryPct}% Recovery Rate`}
            />
            <StatCard
              title="Outstanding Balance"
              value={`₹${(totalOutstanding / 100000).toFixed(1)}L`}
              subtitle="Pending installment tranches"
              icon={Clock}
              iconColor="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard
              title="Payment Compliance"
              value={`${settlements.filter(s => s.payment_status === 'COMPLETED').length} / ${settlements.length}`}
              subtitle="Settlements fully discharged"
              icon={CreditCard}
              iconColor="text-purple-600"
              bgColor="bg-purple-50"
            />
          </div>

          {/* Settlements Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Settlement Agreements Docket</h3>
              <span className="text-[11px] font-mono text-slate-500">Querying SQL View: v_financial_settlement_ledger</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading settlement records...</div>
            ) : settlements.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">No settlement records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-semibold uppercase">
                      <th className="py-3 px-4">Case Reference</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Total Agreed Amount</th>
                      <th className="py-3 px-4">Monthly Alimony</th>
                      <th className="py-3 px-4">Amount Paid / Balance</th>
                      <th className="py-3 px-4">Payment Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {settlements.map((s) => {
                      const agreed = Number(s.total_agreed_amount || 0);
                      const paid = Number(s.total_amount_paid || 0);
                      const balance = agreed - paid;
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-blue-600 block">{s.reference_number}</span>
                            <span className="text-slate-800 font-semibold truncate max-w-xs block">{s.case_title}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {s.settlement_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            ₹{agreed.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            {Number(s.monthly_alimony) > 0 ? (
                              <span>₹{Number(s.monthly_alimony).toLocaleString()} / mo ({s.alimony_tenure_months}m)</span>
                            ) : (
                              <span className="text-slate-400">Lump sum only</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-emerald-700">₹{paid.toLocaleString()} paid</span>
                            <span className="text-slate-400 block text-[11px]">Bal: ₹{balance.toLocaleString()}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded font-semibold text-[11px] border ${
                              s.payment_status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : s.payment_status === 'PARTIALLY_PAID'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {s.payment_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setSelectedSettlement(s);
                                setModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 font-semibold text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Pay</span>
                            </button>
                            <Link
                              href={`/cases/${s.case_id}`}
                              className="inline-flex items-center gap-1 font-semibold text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              <span>Dossier</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Financial Transaction"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <p className="text-xs text-slate-500">
            Recording payment for: <strong>{selectedSettlement?.case_title}</strong> (Ref: {selectedSettlement?.reference_number})
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Payment Amount (₹ INR) *
            </label>
            <input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="e.g. 50000"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Payment Method
            </label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            >
              <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
              <option value="Demand Draft">Demand Draft (Court Deposit)</option>
              <option value="Cheque">Cheque</option>
              <option value="UPI">UPI / Digital</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Transaction Reference / UTR Number *
            </label>
            <input
              type="text"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              placeholder="e.g. TXN-HDFC-10293847"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recording}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              {recording ? 'Recording Transaction...' : 'Commit Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
