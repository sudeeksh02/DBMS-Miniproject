// Shared Legal Vector Constants & Types
// Safe for both client and server components

export const LEGAL_DIMENSIONS = [
  'mutual_consent',      // 0
  'contested_grounds',   // 1
  'alimony_maintenance', // 2
  'child_custody',       // 3
  'asset_division',      // 4
  'cooling_off_waiver',  // 5
  'hindu_marriage_act',  // 6
  'special_marriage_act',// 7
  'mediation_counseling',// 8
  'evidence_procedure',  // 9
  'court_jurisdiction',  // 10
  'cruelty_desertion',   // 11
  'visitation_rights',   // 12
  'financial_affidavit', // 13
  'settlement_agreement',// 14
  'supreme_court_ruling' // 15
];

export interface LegalSearchResult {
  id: string;
  title: string;
  category: string;
  citation: string | null;
  content: string;
  summary: string | null;
  tags: string[];
  similarityScore: number;
}
