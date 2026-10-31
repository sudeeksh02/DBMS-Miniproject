import { MongoClient, Db, Collection } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Divorce Management System - MongoDB Adapter (Official Node.js Driver)
// Manages Document-Oriented Storage: Activity Timelines, Communications, Document Metadata, Case Notes, Audit Logs

export interface CaseActivityDoc {
  _id?: any;
  caseId: string;
  referenceNumber: string;
  eventType: 'CASE_REGISTERED' | 'LAWYER_ASSIGNED' | 'DOCUMENT_UPLOADED' | 'HEARING_SCHEDULED' | 'STATUS_CHANGED' | 'SETTLEMENT_UPDATED' | 'COMMUNICATION_SENT' | 'NOTE_ADDED';
  title: string;
  description: string;
  actorId: string;
  actorName: string;
  actorRole: 'ADMIN' | 'LAWYER' | 'CLIENT' | 'SYSTEM';
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface CaseCommunicationDoc {
  _id?: any;
  caseId: string;
  senderId: string;
  senderName: string;
  senderRole: 'ADMIN' | 'LAWYER' | 'CLIENT';
  recipientId?: string;
  message: string;
  attachments?: { name: string; url: string }[];
  isConfidential: boolean;
  createdAt: Date;
}

export interface CaseDocumentDoc {
  _id?: any;
  caseId: string;
  title: string;
  category: 'Marriage Certificate' | 'Identity Proof' | 'Financial Statements' | 'Petition' | 'Evidence' | 'Settlement Agreement' | 'Court Order' | 'Other';
  fileName: string;
  fileStoragePath: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedByUserId: string;
  uploaderName: string;
  uploaderRole: string;
  allowedRoles: ('ADMIN' | 'LAWYER' | 'CLIENT')[];
  description?: string;
  uploadedAt: Date;
}

export interface CaseNoteDoc {
  _id?: any;
  caseId: string;
  lawyerId: string;
  lawyerName: string;
  noteTitle: string;
  content: string;
  importance: 'LOW' | 'MEDIUM' | 'HIGH';
  isPrivateToCounsel: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogDoc {
  _id?: any;
  userId?: string;
  userRole?: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  status: 'SUCCESS' | 'FAILED' | 'UNAUTHORIZED';
  ipAddress?: string;
  timestamp: Date;
}

class MongoManager {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;
  private fallbackDir = path.join(process.cwd(), 'data', 'mongodb_fallback');

  constructor() {
    if (!fs.existsSync(this.fallbackDir)) {
      fs.mkdirSync(this.fallbackDir, { recursive: true });
    }
  }

  private async connect(): Promise<Db | null> {
    if (this.isConnected && this.db) {
      return this.db;
    }

    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DB_NAME || 'divorce_management_system';

    try {
      this.client = new MongoClient(uri, { serverSelectionTimeoutMS: 2000 });
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.isConnected = true;
      console.log(`[MongoDB] Successfully connected to official MongoDB database: ${dbName}`);

      // Initialize indexes for documents
      await this.initIndexes();
      await this.seedInitialMongoData();

      return this.db;
    } catch (err: any) {
      console.warn(`[MongoDB] Live connection to ${uri} failed (${err.message}). Using persistent JSON fallback store.`);
      this.isConnected = false;
      return null;
    }
  }

  private async initIndexes() {
    if (!this.db) return;
    try {
      await this.db.collection('case_activities').createIndex({ caseId: 1, timestamp: -1 });
      await this.db.collection('case_activities').createIndex({ eventType: 1 });
      await this.db.collection('case_communications').createIndex({ caseId: 1, createdAt: 1 });
      await this.db.collection('case_documents').createIndex({ caseId: 1, category: 1 });
      await this.db.collection('case_notes').createIndex({ caseId: 1, lawyerId: 1 });
      await this.db.collection('audit_logs').createIndex({ timestamp: -1 });
    } catch (e) {
      console.error('[MongoDB] Index creation error:', e);
    }
  }

  // Fallback storage utilities when Mongo server is temporarily unreachable
  private readFallbackCollection<T>(name: string): T[] {
    const file = path.join(this.fallbackDir, `${name}.json`);
    if (!fs.existsSync(file)) return [];
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return [];
    }
  }

  private writeFallbackCollection<T>(name: string, data: T[]) {
    const file = path.join(this.fallbackDir, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  }

  // 1. Case Activities
  async logActivity(activity: Omit<CaseActivityDoc, '_id' | 'timestamp'> & { timestamp?: Date }): Promise<void> {
    const doc: CaseActivityDoc = {
      ...activity,
      timestamp: activity.timestamp || new Date(),
    };

    const db = await this.connect();
    if (db) {
      await db.collection<CaseActivityDoc>('case_activities').insertOne(doc);
    } else {
      const items = this.readFallbackCollection<CaseActivityDoc>('case_activities');
      items.unshift({ ...doc, _id: 'act_' + Date.now() });
      this.writeFallbackCollection('case_activities', items);
    }
  }

  async getCaseActivities(caseId: string): Promise<CaseActivityDoc[]> {
    const db = await this.connect();
    if (db) {
      return await db.collection<CaseActivityDoc>('case_activities')
        .find({ caseId })
        .sort({ timestamp: -1 })
        .toArray();
    } else {
      const items = this.readFallbackCollection<CaseActivityDoc>('case_activities');
      return items.filter(a => a.caseId === caseId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  }

  // 2. Case Communications (Messages between Client and Legal Counsel)
  async saveCommunication(comm: Omit<CaseCommunicationDoc, '_id' | 'createdAt'>): Promise<CaseCommunicationDoc> {
    const doc: CaseCommunicationDoc = {
      ...comm,
      createdAt: new Date(),
    };

    const db = await this.connect();
    if (db) {
      const res = await db.collection<CaseCommunicationDoc>('case_communications').insertOne(doc);
      return { ...doc, _id: res.insertedId };
    } else {
      const items = this.readFallbackCollection<CaseCommunicationDoc>('case_communications');
      const item = { ...doc, _id: 'comm_' + Date.now() };
      items.push(item);
      this.writeFallbackCollection('case_communications', items);
      return item;
    }
  }

  async getCaseCommunications(caseId: string): Promise<CaseCommunicationDoc[]> {
    const db = await this.connect();
    if (db) {
      return await db.collection<CaseCommunicationDoc>('case_communications')
        .find({ caseId })
        .sort({ createdAt: 1 })
        .toArray();
    } else {
      const items = this.readFallbackCollection<CaseCommunicationDoc>('case_communications');
      return items.filter(c => c.caseId === caseId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  }

  // 3. Document Metadata
  async saveDocumentMetadata(meta: Omit<CaseDocumentDoc, '_id' | 'uploadedAt'>): Promise<CaseDocumentDoc> {
    const doc: CaseDocumentDoc = {
      ...meta,
      uploadedAt: new Date(),
    };

    const db = await this.connect();
    if (db) {
      const res = await db.collection<CaseDocumentDoc>('case_documents').insertOne(doc);
      return { ...doc, _id: res.insertedId };
    } else {
      const items = this.readFallbackCollection<CaseDocumentDoc>('case_documents');
      const item = { ...doc, _id: 'doc_' + Date.now() };
      items.unshift(item);
      this.writeFallbackCollection('case_documents', items);
      return item;
    }
  }

  async getCaseDocuments(caseId: string, role?: string): Promise<CaseDocumentDoc[]> {
    const db = await this.connect();
    let docs: CaseDocumentDoc[] = [];

    if (db) {
      docs = await db.collection<CaseDocumentDoc>('case_documents')
        .find({ caseId })
        .sort({ uploadedAt: -1 })
        .toArray();
    } else {
      const items = this.readFallbackCollection<CaseDocumentDoc>('case_documents');
      docs = items.filter(d => d.caseId === caseId);
    }

    if (role && role !== 'ADMIN') {
      return docs.filter(d => !d.allowedRoles || d.allowedRoles.includes(role as any));
    }
    return docs;
  }

  async getAllDocuments(): Promise<CaseDocumentDoc[]> {
    const db = await this.connect();
    if (db) {
      return await db.collection<CaseDocumentDoc>('case_documents')
        .find()
        .sort({ uploadedAt: -1 })
        .toArray();
    } else {
      return this.readFallbackCollection<CaseDocumentDoc>('case_documents');
    }
  }

  // 4. Case Notes (Lawyer Workstation)
  async saveCaseNote(note: Omit<CaseNoteDoc, '_id' | 'createdAt' | 'updatedAt'>): Promise<CaseNoteDoc> {
    const doc: CaseNoteDoc = {
      ...note,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await this.connect();
    if (db) {
      const res = await db.collection<CaseNoteDoc>('case_notes').insertOne(doc);
      return { ...doc, _id: res.insertedId };
    } else {
      const items = this.readFallbackCollection<CaseNoteDoc>('case_notes');
      const item = { ...doc, _id: 'note_' + Date.now() };
      items.unshift(item);
      this.writeFallbackCollection('case_notes', items);
      return item;
    }
  }

  async getCaseNotes(caseId: string, isLawyerOrAdmin: boolean): Promise<CaseNoteDoc[]> {
    const db = await this.connect();
    let notes: CaseNoteDoc[] = [];

    if (db) {
      notes = await db.collection<CaseNoteDoc>('case_notes')
        .find({ caseId })
        .sort({ createdAt: -1 })
        .toArray();
    } else {
      const items = this.readFallbackCollection<CaseNoteDoc>('case_notes');
      notes = items.filter(n => n.caseId === caseId);
    }

    if (!isLawyerOrAdmin) {
      return notes.filter(n => !n.isPrivateToCounsel);
    }
    return notes;
  }

  // 5. Audit Logging
  async logAuditEvent(audit: Omit<AuditLogDoc, '_id' | 'timestamp'>): Promise<void> {
    const doc: AuditLogDoc = {
      ...audit,
      timestamp: new Date(),
    };

    const db = await this.connect();
    if (db) {
      await db.collection<AuditLogDoc>('audit_logs').insertOne(doc);
    } else {
      const items = this.readFallbackCollection<AuditLogDoc>('audit_logs');
      items.unshift({ ...doc, _id: 'aud_' + Date.now() });
      this.writeFallbackCollection('audit_logs', items);
    }
  }

  async getRecentAuditLogs(limit = 25): Promise<AuditLogDoc[]> {
    const db = await this.connect();
    if (db) {
      return await db.collection<AuditLogDoc>('audit_logs')
        .find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
    } else {
      const items = this.readFallbackCollection<AuditLogDoc>('audit_logs');
      return items.slice(0, limit);
    }
  }

  // ==========================================================================
  // MANDATORY ADVANCED MONGODB AGGREGATION PIPELINES
  // ==========================================================================

  // Aggregation Pipeline 1: Monthly Case Activity Analytics
  // Uses $group, $project, $sort, $facet to compute monthly activity cadence & event distributions
  async getActivityAnalyticsPipeline(): Promise<{
    monthlyActivityTrends: { month: string; eventCount: number; uniqueCases: number }[];
    eventTypeDistribution: { eventType: string; count: number }[];
    topActors: { actorName: string; actorRole: string; actionsCount: number }[];
  }> {
    const db = await this.connect();
    if (db) {
      try {
        const pipeline = [
          {
            $facet: {
              // Pipeline Branch 1: Monthly Trends
              monthlyTrends: [
                {
                  $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$timestamp' } },
                    eventCount: { $sum: 1 },
                    casesSet: { $addToSet: '$caseId' },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    month: '$_id',
                    eventCount: 1,
                    uniqueCases: { $size: '$casesSet' },
                  },
                },
                { $sort: { month: 1 } },
              ],
              // Pipeline Branch 2: Event Type Distribution
              eventDistribution: [
                {
                  $group: {
                    _id: '$eventType',
                    count: { $sum: 1 },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    eventType: '$_id',
                    count: 1,
                  },
                },
                { $sort: { count: -1 } },
              ],
              // Pipeline Branch 3: Actor Action Velocity
              actorVelocity: [
                {
                  $group: {
                    _id: { actorName: '$actorName', actorRole: '$actorRole' },
                    actionsCount: { $sum: 1 },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    actorName: '$_id.actorName',
                    actorRole: '$_id.actorRole',
                    actionsCount: 1,
                  },
                },
                { $sort: { actionsCount: -1 } },
                { $limit: 6 },
              ],
            },
          },
        ];

        const results = await db.collection('case_activities').aggregate(pipeline).toArray();
        const facet = results[0] || {};
        return {
          monthlyActivityTrends: facet.monthlyTrends || [],
          eventTypeDistribution: facet.eventDistribution || [],
          topActors: facet.actorVelocity || [],
        };
      } catch (err) {
        console.error('[MongoDB Aggregation] Error executing pipeline:', err);
      }
    }

    // Fallback aggregation logic if offline
    const items = this.readFallbackCollection<CaseActivityDoc>('case_activities');
    const monthlyMap: Record<string, { count: number; cases: Set<string> }> = {};
    const eventMap: Record<string, number> = {};
    const actorMap: Record<string, { name: string; role: string; count: number }> = {};

    for (const item of items) {
      const d = new Date(item.timestamp);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[m]) monthlyMap[m] = { count: 0, cases: new Set() };
      monthlyMap[m].count++;
      monthlyMap[m].cases.add(item.caseId);

      eventMap[item.eventType] = (eventMap[item.eventType] || 0) + 1;

      const actKey = `${item.actorName}|${item.actorRole}`;
      if (!actorMap[actKey]) actorMap[actKey] = { name: item.actorName, role: item.actorRole, count: 0 };
      actorMap[actKey].count++;
    }

    return {
      monthlyActivityTrends: Object.entries(monthlyMap).map(([month, data]) => ({
        month,
        eventCount: data.count,
        uniqueCases: data.cases.size,
      })).sort((a, b) => a.month.localeCompare(b.month)),
      eventTypeDistribution: Object.entries(eventMap).map(([eventType, count]) => ({
        eventType,
        count,
      })).sort((a, b) => b.count - a.count),
      topActors: Object.values(actorMap).map(a => ({
        actorName: a.name,
        actorRole: a.role,
        actionsCount: a.count,
      })).sort((a, b) => b.actionsCount - a.actionsCount).slice(0, 6),
    };
  }

  private async seedInitialMongoData() {
    if (!this.db) return;
    try {
      const count = await this.db.collection('case_activities').countDocuments();
      if (count === 0) {
        console.log('[MongoDB] Populating initial synthetic document collections...');
        const initialActivities: CaseActivityDoc[] = [
          {
            caseId: 'cas-001',
            referenceNumber: 'DIV-2026-0001',
            eventType: 'CASE_REGISTERED',
            title: 'Divorce Petition Registered',
            description: 'Mutual consent petition filed under Section 13B with joint marriage affidavit.',
            actorId: 'usr-cli-001',
            actorName: 'Arjun Kapoor',
            actorRole: 'CLIENT',
            timestamp: new Date(Date.now() - 60 * 86400000),
          },
          {
            caseId: 'cas-001',
            referenceNumber: 'DIV-2026-0001',
            eventType: 'LAWYER_ASSIGNED',
            title: 'Counsel Assigned',
            description: 'Adv. Kavita Sharma appointed as lead counsel for petitioner.',
            actorId: 'usr-admin-001',
            actorName: 'Advocate Rajeshwari Sen (Registrar)',
            actorRole: 'ADMIN',
            timestamp: new Date(Date.now() - 58 * 86400000),
          },
          {
            caseId: 'cas-001',
            referenceNumber: 'DIV-2026-0001',
            eventType: 'DOCUMENT_UPLOADED',
            title: 'Marriage Certificate Deposited',
            description: 'Original government-notarized marriage certificate uploaded to secure docket.',
            actorId: 'usr-law-003',
            actorName: 'Adv. Kavita Sharma',
            actorRole: 'LAWYER',
            timestamp: new Date(Date.now() - 50 * 86400000),
          },
          {
            caseId: 'cas-001',
            referenceNumber: 'DIV-2026-0001',
            eventType: 'HEARING_SCHEDULED',
            title: 'Preliminary Appearance Hearing Fixed',
            description: 'First motion hearing scheduled before Principal Family Court, Hall 2.',
            actorId: 'usr-admin-001',
            actorName: 'Advocate Rajeshwari Sen (Registrar)',
            actorRole: 'ADMIN',
            timestamp: new Date(Date.now() - 35 * 86400000),
          },
          {
            caseId: 'cas-001',
            referenceNumber: 'DIV-2026-0001',
            eventType: 'SETTLEMENT_UPDATED',
            title: 'Settlement Terms Agreed',
            description: 'Mutual assent reached on Rs. 45L lump-sum and Rs. 75,000 monthly maintenance.',
            actorId: 'usr-law-003',
            actorName: 'Adv. Kavita Sharma',
            actorRole: 'LAWYER',
            timestamp: new Date(Date.now() - 20 * 86400000),
          },
          {
            caseId: 'cas-002',
            referenceNumber: 'DIV-2026-0002',
            eventType: 'CASE_REGISTERED',
            title: 'Contested Petition Lodged',
            description: 'Contested divorce petition filed under Section 13(1)(ia) alleging cruelty & irretrievable breakdown.',
            actorId: 'usr-cli-003',
            actorName: 'Rohit Verma',
            actorRole: 'CLIENT',
            timestamp: new Date(Date.now() - 45 * 86400000),
          },
          {
            caseId: 'cas-002',
            referenceNumber: 'DIV-2026-0002',
            eventType: 'HEARING_SCHEDULED',
            title: 'Summons Appearance Hearing Set',
            description: 'Summons returnable date fixed before Family Court Bandra, Division 4.',
            actorId: 'usr-admin-001',
            actorName: 'Advocate Rajeshwari Sen (Registrar)',
            actorRole: 'ADMIN',
            timestamp: new Date(Date.now() - 40 * 86400000),
          },
        ];

        await this.db.collection('case_activities').insertMany(initialActivities);

        // Seed initial documents metadata
        const initialDocs: CaseDocumentDoc[] = [
          {
            caseId: 'cas-001',
            title: 'Marriage Certificate (Bengaluru Corporation)',
            category: 'Marriage Certificate',
            fileName: 'marriage_cert_kapoor_2018.pdf',
            fileStoragePath: 'uploads/marriage_cert_kapoor_2018.pdf',
            fileSizeBytes: 245000,
            mimeType: 'application/pdf',
            uploadedByUserId: 'usr-cli-001',
            uploaderName: 'Arjun Kapoor',
            uploaderRole: 'CLIENT',
            allowedRoles: ['ADMIN', 'LAWYER', 'CLIENT'],
            description: 'Registered marriage certificate dated 20-Nov-2018.',
            uploadedAt: new Date(Date.now() - 50 * 86400000),
          },
          {
            caseId: 'cas-001',
            title: 'Joint Asset Disclosure & Bank Statements',
            category: 'Financial Statements',
            fileName: 'joint_asset_disclosure_signed.pdf',
            fileStoragePath: 'uploads/joint_asset_disclosure_signed.pdf',
            fileSizeBytes: 1820000,
            mimeType: 'application/pdf',
            uploadedByUserId: 'usr-law-003',
            uploaderName: 'Adv. Kavita Sharma',
            uploaderRole: 'LAWYER',
            allowedRoles: ['ADMIN', 'LAWYER', 'CLIENT'],
            description: 'Comprehensive financial disclosures pursuant to Rajnesh v. Neha guidelines.',
            uploadedAt: new Date(Date.now() - 25 * 86400000),
          },
          {
            caseId: 'cas-001',
            title: 'Executed Settlement Agreement Form VII',
            category: 'Settlement Agreement',
            fileName: 'executed_settlement_agreement.pdf',
            fileStoragePath: 'uploads/executed_settlement_agreement.pdf',
            fileSizeBytes: 620000,
            mimeType: 'application/pdf',
            uploadedByUserId: 'usr-law-003',
            uploaderName: 'Adv. Kavita Sharma',
            uploaderRole: 'LAWYER',
            allowedRoles: ['ADMIN', 'LAWYER', 'CLIENT'],
            description: 'Bipartite signed settlement deed for mutual consent dissolution.',
            uploadedAt: new Date(Date.now() - 20 * 86400000),
          },
          {
            caseId: 'cas-002',
            title: 'Contested Petition & Grounds Affidavit',
            category: 'Petition',
            fileName: 'contested_petition_rohit_verma.pdf',
            fileStoragePath: 'uploads/contested_petition_rohit_verma.pdf',
            fileSizeBytes: 890000,
            mimeType: 'application/pdf',
            uploadedByUserId: 'usr-law-002',
            uploaderName: 'Adv. Ananya Deshmukh',
            uploaderRole: 'LAWYER',
            allowedRoles: ['ADMIN', 'LAWYER'],
            description: 'Primary petition seeking dissolution on ground of matrimonial cruelty.',
            uploadedAt: new Date(Date.now() - 44 * 86400000),
          },
        ];

        await this.db.collection('case_documents').insertMany(initialDocs);

        // Seed initial communications
        const initialComms: CaseCommunicationDoc[] = [
          {
            caseId: 'cas-001',
            senderId: 'usr-cli-001',
            senderName: 'Arjun Kapoor',
            senderRole: 'CLIENT',
            message: 'Hello Adv. Sharma, we have finalized the school transfer consent for Aarav. Please review the updated custody clause.',
            isConfidential: true,
            createdAt: new Date(Date.now() - 15 * 86400000),
          },
          {
            caseId: 'cas-001',
            senderId: 'usr-law-003',
            senderName: 'Adv. Kavita Sharma',
            senderRole: 'LAWYER',
            message: 'Received Arjun. The revised clause aligns with the court precedent. I will prepare the supplemental affidavit for the upcoming hearing.',
            isConfidential: true,
            createdAt: new Date(Date.now() - 14 * 86400000),
          },
        ];

        await this.db.collection('case_communications').insertMany(initialComms);

        // Seed initial notes
        const initialNotes: CaseNoteDoc[] = [
          {
            caseId: 'cas-001',
            lawyerId: 'law-003',
            lawyerName: 'Adv. Kavita Sharma',
            noteTitle: 'Cooling-off Period Exemption Strategy',
            content: 'Client separation duration exceeds 18 months. Citing Supreme Court ruling in Amardeep Singh v. Harveen Kaur to seek waiver of statutory 6-month waiting period on next hearing.',
            importance: 'HIGH',
            isPrivateToCounsel: true,
            createdAt: new Date(Date.now() - 28 * 86400000),
            updatedAt: new Date(Date.now() - 28 * 86400000),
          },
        ];

        await this.db.collection('case_notes').insertMany(initialNotes);

        // Write fallback backup as well
        this.writeFallbackCollection('case_activities', initialActivities);
        this.writeFallbackCollection('case_documents', initialDocs);
        this.writeFallbackCollection('case_communications', initialComms);
        this.writeFallbackCollection('case_notes', initialNotes);

        console.log('[MongoDB] Initial collections populated successfully.');
      }
    } catch (e) {
      console.error('[MongoDB] Seeding error:', e);
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_DB_NAME || 'divorce_management_system',
      mode: this.isConnected ? 'Live Official MongoDB Driver' : 'JSON Persistent Document Engine',
    };
  }
}

declare global {
  var __mongoManager: MongoManager | undefined;
}

const mongo = global.__mongoManager || new MongoManager();
if (process.env.NODE_ENV !== 'production') {
  global.__mongoManager = mongo;
}

export default mongo;
