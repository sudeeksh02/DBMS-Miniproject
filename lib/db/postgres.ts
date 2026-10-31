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

  private async getClient(): Promise<{ type: 'pool' | 'pglite'; client: Pool | PGlite }> {
    if (this.isInitialized) {
      if (this.pool) return { type: 'pool', client: this.pool };
      if (this.pglite) return { type: 'pglite', client: this.pglite };
    }

    const databaseUrl = process.env.DATABASE_URL;

    // Check if external Postgres is available and requested
    if (databaseUrl && !databaseUrl.includes('placeholder')) {
      try {
        const testPool = new Pool({
          connectionString: databaseUrl,
          connectionTimeoutMillis: 3000,
        });
        await testPool.query('SELECT 1;');
        this.pool = testPool;
        this.isInitialized = true;
        this.isUsingPglite = false;
        console.log('[PostgreSQL] Connected successfully to external PostgreSQL via DATABASE_URL');
        return { type: 'pool', client: this.pool };
      } catch (err: any) {
        console.warn('[PostgreSQL] External PostgreSQL connection failed. Falling back to persistent PGlite engine:', err.message);
      }
    }

    // Initialize embedded PGlite engine with persistent filesystem directory
    const dataDir = path.join(process.cwd(), 'data', 'postgres');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.pglite = new PGlite(dataDir);
    this.isInitialized = true;
    this.isUsingPglite = true;
    console.log('[PostgreSQL] Initialized embedded PostgreSQL (PGlite) with storage at:', dataDir);

    await this.bootstrapSchemaIfEmpty();

    return { type: 'pglite', client: this.pglite };
  }

  private async bootstrapSchemaIfEmpty() {
    try {
      const checkRes = await this.query("SELECT to_regclass('public.divorce_cases') AS tbl;");
      if (!checkRes.rows[0]?.tbl) {
        console.log('[PostgreSQL] Database tables not detected. Executing schema.sql bootstrap...');
        const schemaPath = path.join(process.cwd(), 'sql', 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          const schemaSql = fs.readFileSync(schemaPath, 'utf8');
          await this.exec(schemaSql);
          console.log('[PostgreSQL] Schema DDL executed successfully.');
        }

        const seedPath = path.join(process.cwd(), 'sql', 'seed.sql');
        if (fs.existsSync(seedPath)) {
          const seedSql = fs.readFileSync(seedPath, 'utf8');
          await this.exec(seedSql);
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
