import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';

// Dual-mode PostgreSQL Adapter
// Supports standard external PostgreSQL (DATABASE_URL) and embedded PGlite WASM engine
// Guarantees 100% genuine PostgreSQL relational execution with ACID transactions, triggers, and views

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface IDatabaseClient {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  exec(sql: string): Promise<void>;
  transaction<T>(fn: (txClient: IDatabaseClient) => Promise<T>): Promise<T>;
}

class PostgresManager implements IDatabaseClient {
  private pool: Pool | null = null;
  private pglite: PGlite | null = null;
  private isInitialized = false;
  private isUsingPglite = false;

  // Single shared initialisation promise: concurrent first requests must not open
  // two PGlite instances on the same data directory or bootstrap the schema twice
  private initPromise: Promise<{ type: 'pool' | 'pglite'; client: Pool | PGlite }> | null = null;

  private getClient(): Promise<{ type: 'pool' | 'pglite'; client: Pool | PGlite }> {
    if (!this.initPromise) {
      this.initPromise = this.initialize().catch((err) => {
        this.initPromise = null; // allow a retry on the next request
        throw err;
      });
    }
    return this.initPromise;
  }

  private async initialize(): Promise<{ type: 'pool' | 'pglite'; client: Pool | PGlite }> {
    const databaseUrl = process.env.DATABASE_URL;

    // Check if external Postgres is available and requested
    if (databaseUrl && !databaseUrl.includes('placeholder')) {
      const testPool = new Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 3000,
      });
      try {
        await testPool.query('SELECT 1;');
        this.pool = testPool;
        this.isInitialized = true;
        this.isUsingPglite = false;
        console.log('[PostgreSQL] Connected successfully to external PostgreSQL via DATABASE_URL');
        await this.bootstrapSchemaIfEmpty(
          (sql) => testPool.query(sql).then((r) => r.rows),
          (sql) => testPool.query(sql).then(() => undefined)
        );
        return { type: 'pool', client: testPool };
      } catch (err: any) {
        console.warn('[PostgreSQL] External PostgreSQL connection failed. Falling back to persistent PGlite engine:', err.message);
        await testPool.end().catch(() => undefined);
        this.pool = null;
      }
    }

    // Initialize embedded PGlite engine with persistent filesystem directory
    const dataDir = path.join(process.cwd(), 'data', 'postgres');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const pglite = new PGlite(dataDir);
    this.pglite = pglite;
    this.isInitialized = true;
    this.isUsingPglite = true;
    console.log('[PostgreSQL] Initialized embedded PostgreSQL (PGlite) with storage at:', dataDir);

    await this.bootstrapSchemaIfEmpty(
      (sql) => pglite.query(sql).then((r: any) => r.rows || []),
      (sql) => pglite.exec(sql).then(() => undefined)
    );

    return { type: 'pglite', client: pglite };
  }

  // Runs sql/schema.sql + sql/seed.sql once, when the database has no DMS tables yet.
  // Uses the raw driver callbacks (not this.query) so it can run during initialisation.
  private async bootstrapSchemaIfEmpty(
    rawQuery: (sql: string) => Promise<any[]>,
    rawExec: (sql: string) => Promise<void>
  ) {
    try {
      const rows = await rawQuery("SELECT to_regclass('public.divorce_cases') AS tbl;");
      if (!rows[0]?.tbl) {
        console.log('[PostgreSQL] Database tables not detected. Executing schema.sql bootstrap...');
        const schemaPath = path.join(process.cwd(), 'sql', 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          await rawExec(fs.readFileSync(schemaPath, 'utf8'));
          console.log('[PostgreSQL] Schema DDL executed successfully.');
        }

        const seedPath = path.join(process.cwd(), 'sql', 'seed.sql');
        if (fs.existsSync(seedPath)) {
          await rawExec(fs.readFileSync(seedPath, 'utf8'));
          console.log('[PostgreSQL] Initial seed dataset loaded successfully.');
        }
      }
    } catch (e: any) {
      console.error('[PostgreSQL] Schema bootstrap error:', e);
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    const { type, client } = await this.getClient();
    if (type === 'pool') {
      const res = await (client as Pool).query(sql, params);
      return { rows: res.rows, rowCount: res.rowCount ?? res.rows.length };
    } else {
      const res = await (client as PGlite).query(sql, params);
      return { rows: (res.rows || []) as T[], rowCount: res.rowCount ?? (res.rows ? res.rows.length : 0) };
    }
  }

  async exec(sql: string): Promise<void> {
    const { type, client } = await this.getClient();
    if (type === 'pool') {
      await (client as Pool).query(sql);
    } else {
      await (client as PGlite).exec(sql);
    }
  }

  async transaction<T>(fn: (txClient: IDatabaseClient) => Promise<T>): Promise<T> {
    const { type, client } = await this.getClient();

    if (type === 'pool') {
      const poolClient = await (client as Pool).connect();
      try {
        await poolClient.query('BEGIN');
        const txWrapper: IDatabaseClient = {
          query: async (q, p = []) => {
            const res = await poolClient.query(q, p);
            return { rows: res.rows, rowCount: res.rowCount ?? res.rows.length };
          },
          exec: async (s) => {
            await poolClient.query(s);
          },
          transaction: () => {
            throw new Error('Nested transactions not supported');
          },
        };
        const result = await fn(txWrapper);
        await poolClient.query('COMMIT');
        return result;
      } catch (err) {
        await poolClient.query('ROLLBACK');
        throw err;
      } finally {
        poolClient.release();
      }
    } else {
      const pgliteInstance = client as PGlite;
      return await pgliteInstance.transaction(async (tx) => {
        const txWrapper: IDatabaseClient = {
          query: async (q, p = []) => {
            const res = await tx.query(q, p);
            return { rows: res.rows as any[], rowCount: res.rowCount ?? res.rows.length };
          },
          exec: async (s) => {
            await tx.exec(s);
          },
          transaction: () => {
            throw new Error('Nested transactions not supported');
          },
        };
        return await fn(txWrapper);
      });
    }
  }

  getEngineInfo() {
    return {
      isUsingPglite: this.isUsingPglite,
      engine: this.isUsingPglite ? 'PGlite WASM (PostgreSQL 16 Engine)' : 'PostgreSQL Server (pg Pool)',
      isInitialized: this.isInitialized,
    };
  }
}

// Global singleton instance
declare global {
  var __postgresManager: PostgresManager | undefined;
}

const db: PostgresManager = global.__postgresManager || new PostgresManager();
if (process.env.NODE_ENV !== 'production') {
  global.__postgresManager = db;
}

export default db;
