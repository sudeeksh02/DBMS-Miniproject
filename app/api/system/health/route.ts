import { NextResponse } from 'next/server';
import db from '@/lib/db/postgres';
import mongo from '@/lib/db/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pgInfo = db.getEngineInfo();
    const mongoStatus = mongo.getStatus();

    // Check Postgres
    let pgTables = 0;
    let pgOk = false;
    try {
      const res = await db.query(
        "SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = 'public';"
      );
      pgTables = Number(res.rows[0]?.count || 0);
      pgOk = true;
    } catch (e: any) {
      console.error('Postgres health check error:', e.message);
    }

    // Check Legal Resources (pgvector)
    let vectorCount = 0;
    try {
      const res = await db.query('SELECT COUNT(*) AS count FROM legal_resources;');
      vectorCount = Number(res.rows[0]?.count || 0);
    } catch {}

    // Check MongoDB collections
    let mongoActivitiesCount = 0;
    try {
      const acts = await mongo.getCaseActivities('cas-001');
      mongoActivitiesCount = acts.length;
    } catch {}

    return NextResponse.json({
      status: pgOk ? 'HEALTHY' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      databases: {
        postgresql: {
          status: pgOk ? 'ONLINE' : 'OFFLINE',
          engine: pgInfo.engine,
          tablesCount: pgTables,
          architecture: '3NF Relational (ACID Transactions, Triggers, Views)',
        },
        mongodb: {
          status: mongoStatus.connected ? 'ONLINE' : 'PERSISTENT_FALLBACK',
          mode: mongoStatus.mode,
          database: mongoStatus.database,
          architecture: 'Document-Oriented (Activity Timelines, Documents, Aggregations)',
        },
        pgvector: {
          status: vectorCount > 0 ? 'ACTIVE' : 'READY',
          indexedResources: vectorCount,
          dimensions: 16,
          similarityMetric: 'Cosine Similarity (fn_cosine_similarity / <=>)',
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'ERROR', message: error.message },
      { status: 500 }
    );
  }
}
