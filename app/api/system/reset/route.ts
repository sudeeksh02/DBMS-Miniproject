import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import db from '@/lib/db/postgres';
import { requireAuth } from '@/lib/auth';

export async function POST() {
  try {
    await requireAuth(['ADMIN']);

    const resetPath = path.join(process.cwd(), 'sql', 'reset.sql');
    const schemaPath = path.join(process.cwd(), 'sql', 'schema.sql');
    const seedPath = path.join(process.cwd(), 'sql', 'seed.sql');

    if (fs.existsSync(resetPath)) {
      const resetSql = fs.readFileSync(resetPath, 'utf8');
      await db.exec(resetSql);
    }

    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await db.exec(schemaSql);
    }

    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await db.exec(seedSql);
    }

    return NextResponse.json({
      success: true,
      message: 'Database schema successfully reset and repopulated with benchmark academic seed dataset.',
    });
  } catch (error: any) {
    console.error('System reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset database', message: error.message },
      { status: 500 }
    );
  }
}
