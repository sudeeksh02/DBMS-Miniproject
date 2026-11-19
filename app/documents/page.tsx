'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Download, RefreshCw, LoaderCircle as Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DocumentVaultPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dRes, aRes] = await Promise.all([fetch('/api/documents'), fetch('/api/auth/me')]);
      const dData = await dRes.json();
      const aData = await aRes.json();
      if (!dRes.ok) throw new Error(dData.message || dData.error || 'Failed to load documents');
      setDocs(dData.documents || []);
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

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Document Vault"
          subtitle="Case documents and evidence (metadata in MongoDB, files on disk), filtered by your role"
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
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-10 flex items-center justify-center text-slate-500 text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading documents...
              </div>
            ) : docs.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">
                No documents available for your role. Upload documents from a case page.
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Document</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Uploaded By</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {docs.map((d, i) => (
                    <tr key={d._id || d.id || i} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="font-semibold text-slate-900">{d.title || d.fileName}</p>
                            <p className="text-xs font-mono text-slate-500">
                              {d.fileName}
                              {d.fileSizeBytes ? ` • ${Math.round(d.fileSizeBytes / 1024)} KB` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{d.category}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {d.uploaderName || '-'}
                        {d.uploaderRole ? ` (${d.uploaderRole})` : ''}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {d.caseId && (
                          <Link
                            href={`/cases/${d.caseId}`}
                            className="inline-flex text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg"
                          >
                            Open case
                          </Link>
                        )}
                        <a
                          href={`/api/documents/${d.fileName}/download`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
