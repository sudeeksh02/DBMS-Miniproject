'use client';

import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  BookOpen,
  FileCheck2,
  Scale,
  Clock,
  Layers,
  ShieldAlert,
  ArrowRight,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { LEGAL_DIMENSIONS } from '@/lib/constants/vector';

export default function SemanticSearchPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleQueries = [
    'cooling off waiver period mutual consent divorce section 13b',
    'child custody guidelines and parental welfare factors',
    'determining permanent alimony and maintenance rajnesh v neha',
    'settlement agreement clauses template asset division',
    'special marriage act section 28 civil divorce procedure',
  ];

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery || query;
    if (!q.trim()) return;

    if (customQuery) setQuery(customQuery);

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, category, topK: 5 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Vector retrieval failed');
      setResponse(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Legal AI Assistant & Semantic Search (pgvector)"
          subtitle="Vector similarity retrieval across matrimonial statutes, judicial precedents, and mediation forms"
        />

        <main className="flex-1 p-6 space-y-6 max-w-5xl mx-auto w-full">
          {/* Academic Architecture Banner */}
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md border border-purple-800">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl shrink-0 text-purple-300">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold">Vector Database Architecture (pgvector Cosine Metric)</h2>
                  <span className="text-[10px] font-mono bg-purple-400/20 text-purple-200 px-2 py-0.5 rounded border border-purple-400/30">
                    16-D Unit Hypersphere
                  </span>
                </div>
                <p className="text-xs text-purple-200/90 leading-relaxed">
                  Queries are projected into a 16-dimensional ontological legal vector space. Similarity is evaluated using PostgreSQL's <code className="font-mono text-amber-300">fn_cosine_similarity(embedding, $1::float8[])</code> and pgvector <code className="font-mono text-amber-300">&lt;=&gt;</code> cosine distance operators.
                </p>
              </div>
            </div>
          </div>

          {/* Search Query Input Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <form onSubmit={(e) => handleSearch(e)} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a legal or procedural question e.g. How does cooling off waiver work in Section 13B?..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-3 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="STATUTE">Statute</option>
                    <option value="PRECEDENT">Judicial Precedent</option>
                    <option value="PROCEDURAL_GUIDE">Procedural Guide</option>
                    <option value="DOCUMENT_TEMPLATE">Document Template</option>
                  </select>

                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Search</span>
                  </button>
                </div>
              </div>

              {/* Sample Queries Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                  Try Benchmark Queries:
                </span>
                {sampleQueries.map((sq, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSearch(undefined, sq)}
                    className="text-[11px] bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                  >
                    &ldquo;{sq.slice(0, 36)}...&rdquo;
                  </button>
                ))}
              </div>
            </form>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          {/* Search Results & Vector Dimension Inspection */}
          {response && (
            <div className="space-y-6">
              {/* Vector Query Telemetry */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-mono text-purple-400 font-bold">Query Embedding Vector Telemetry</span>
                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span>Execution: <strong className="text-emerald-400">{response.executionTimeMs} ms</strong></span>
                    <span>Metric: <strong className="text-amber-400">{response.retrievalMetric}</strong></span>
                  </div>
                </div>

                {/* Display 16 vector weights */}
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1.5">
                    16-Dimensional Ontological Weights Projection:
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 font-mono text-[10px]">
                    {response.queryVector?.map((val: number, idx: number) => (
                      <div key={idx} className="bg-slate-800/80 p-1.5 rounded text-center border border-slate-700">
                        <span className="text-slate-400 block text-[9px] truncate">{LEGAL_DIMENSIONS[idx]}</span>
                        <span className={val > 0.3 ? 'text-amber-400 font-bold' : 'text-slate-400'}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Matched Documents */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">
                  Semantic Cosine Matches ({response.results?.length} Resources Retrieved)
                </h3>

                {response.results?.map((res: any, idx: number) => {
                  const score = Number(res.similarityScore || 0);
                  const pct = Math.round(score * 100);
                  return (
                    <div
                      key={res.id}
                      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-purple-300 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              {res.category}
                            </span>
                            {res.citation && (
                              <span className="text-[11px] font-mono text-slate-500">
                                {res.citation}
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-slate-900">{res.title}</h4>
                        </div>

                        {/* Similarity Score Pill */}
                        <div className="text-right shrink-0">
                          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-bold font-mono">
                            <span>Score: {score}</span>
                            <span className="text-[10px] opacity-70">({pct}%)</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Cosine Similarity</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {res.content}
                      </p>

                      {res.summary && (
                        <p className="text-xs text-slate-500">
                          <strong className="text-slate-700">Digest:</strong> {res.summary}
                        </p>
                      )}

                      {res.tags && res.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {res.tags.map((tag: string, tIdx: number) => (
                            <span key={tIdx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Disclaimer */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                {response.disclaimer}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
