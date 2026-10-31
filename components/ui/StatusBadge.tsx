import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status ? status.toUpperCase().replace(/\s+/g, '_') : 'REGISTERED';

  const styles: Record<string, { bg: string; text: string; border: string; label: string }> = {
    REGISTERED: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', label: 'Registered' },
    UNDER_REVIEW: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Under Review' },
    DOCUMENTATION_PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Docs Pending' },
    MEDIATION: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Mediation' },
    HEARING_SCHEDULED: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Hearing Scheduled' },
    SETTLEMENT_NEGOTIATION: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', label: 'Settlement Negotiation' },
    AWAITING_FINAL_ORDER: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Awaiting Order' },
    RESOLVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Resolved' },
    CLOSED: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', label: 'Closed' },
  };

  const style = styles[normalized] || styles.REGISTERED;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {style.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const norm = (priority || 'MEDIUM').toUpperCase();

  const styles: Record<string, { bg: string; text: string; border: string }> = {
    LOW: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
    MEDIUM: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    HIGH: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    URGENT: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' },
  };

  const style = styles[norm] || styles.MEDIUM;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}>
      {norm}
    </span>
  );
}
