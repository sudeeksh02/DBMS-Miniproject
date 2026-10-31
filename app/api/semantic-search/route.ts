import { NextResponse } from 'next/server';
import { z } from 'zod';
import { searchLegalResources } from '@/lib/db/vector';
import { requireAuth } from '@/lib/auth';

const searchSchema = z.object({
  query: z.string().min(2, 'Search query must be at least 2 characters'),
  topK: z.coerce.number().min(1).max(20).default(5),
  category: z.string().default('ALL'),
});

export async function POST(request: Request) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = searchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { query, topK, category } = parsed.data;

    const result = await searchLegalResources(query, topK, category);

    return NextResponse.json({
      success: true,
      query,
      results: result.results,
      queryVector: result.queryVector,
      retrievalMetric: result.retrievalMetric,
      executionTimeMs: result.executionTimeMs,
      disclaimer: 'DISCLAIMER: This system provides academic legal information and procedural templates for educational purposes only. It does not constitute formal legal counsel or advisory.',
    });
  } catch (error: any) {
    console.error('Semantic search error:', error);
    return NextResponse.json(
      { error: 'Semantic vector retrieval failed', message: error.message },
      { status: 500 }
    );
  }
}
