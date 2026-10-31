import { NextResponse } from 'next/server';
import db from '@/lib/db/postgres';
import mongo from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAuth();

    // 1. Core Relational Aggregated Counters (SQL)
    const countsSql = `
      SELECT 
        COUNT(*) AS total_cases,
        COUNT(CASE WHEN status = 'REGISTERED' THEN 1 END) AS registered_cases,
        COUNT(CASE WHEN status IN ('UNDER_REVIEW', 'DOCUMENTATION_PENDING', 'MEDIATION', 'HEARING_SCHEDULED', 'SETTLEMENT_NEGOTIATION', 'AWAITING_FINAL_ORDER') THEN 1 END) AS ongoing_cases,
        COUNT(CASE WHEN status IN ('RESOLVED', 'CLOSED') THEN 1 END) AS resolved_cases,
        COUNT(CASE WHEN priority = 'URGENT' AND status NOT IN ('RESOLVED', 'CLOSED') THEN 1 END) AS urgent_cases
      FROM divorce_cases;
    `;
    const countsRes = await db.query(countsSql);
    const counts = countsRes.rows[0];

    // 2. Total Lawyers & Clients
    const lawyersCountRes = await db.query('SELECT COUNT(*) AS total_lawyers FROM lawyers;');
    const clientsCountRes = await db.query('SELECT COUNT(*) AS total_clients FROM clients;');

    // 3. Upcoming Hearings Count
    const upcomingHearingsRes = await db.query(
      `SELECT COUNT(*) AS upcoming_hearings FROM hearings WHERE hearing_date >= CURRENT_TIMESTAMP AND outcome = 'SCHEDULED';`
    );

    // 4. Status Distribution (SQL GROUP BY)
    const statusDistRes = await db.query(`
      SELECT status, COUNT(*) AS count
      FROM divorce_cases
      GROUP BY status
      ORDER BY count DESC;
    `);

    // 5. Category Distribution (SQL GROUP BY)
    const categoryDistRes = await db.query(`
      SELECT divorce_category, COUNT(*) AS count
      FROM divorce_cases
      GROUP BY divorce_category
      ORDER BY count DESC;
    `);

    // 6. Monthly Case Registrations Trend (SQL DATE_TRUNC)
    const monthlyRegistrationsRes = await db.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', filing_date), 'Mon YYYY') AS month_label,
        TO_CHAR(DATE_TRUNC('month', filing_date), 'YYYY-MM') AS month_key,
        COUNT(*) AS count
      FROM divorce_cases
      GROUP BY DATE_TRUNC('month', filing_date)
      ORDER BY month_key ASC;
    `);

    // 7. Lawyer Workload Breakdown (From SQL View v_lawyer_workload_metrics)
    const lawyerWorkloadRes = await db.query(`
      SELECT lawyer_id, lawyer_name, bar_registration_number, specialization, 
             active_cases_count, max_case_capacity, capacity_utilization_pct, pending_hearings_count
      FROM v_lawyer_workload_metrics
      ORDER BY active_cases_count DESC;
    `);

    // 8. Financial Settlements Breakdown (From SQL View v_financial_settlement_ledger)
    const financialLedgerRes = await db.query(`
      SELECT 
        COUNT(*) AS total_settlements,
        COALESCE(SUM(total_agreed_amount), 0) AS total_agreed_sum,
        COALESCE(SUM(total_amount_paid), 0) AS total_paid_sum,
        COALESCE(SUM(balance_outstanding), 0) AS total_outstanding_sum,
        COUNT(CASE WHEN payment_status = 'COMPLETED' THEN 1 END) AS completed_settlements_count,
        COUNT(CASE WHEN payment_status = 'PARTIALLY_PAID' THEN 1 END) AS partial_settlements_count,
        COUNT(CASE WHEN payment_status = 'PENDING' THEN 1 END) AS pending_settlements_count
      FROM v_financial_settlement_ledger;
    `);
    const financialStats = financialLedgerRes.rows[0];

    // 9. Case Resolution Statistics (Resolution Latency)
    const resolutionStatsRes = await db.query(`
      SELECT 
        COUNT(*) AS total_resolved,
        ROUND(AVG(resolution_date - filing_date), 1) AS avg_resolution_days,
        MIN(resolution_date - filing_date) AS min_resolution_days,
        MAX(resolution_date - filing_date) AS max_resolution_days
      FROM divorce_cases
      WHERE resolution_date IS NOT NULL;
    `);

    // 10. MONGODB AGGREGATION PIPELINE (Activity Analytics)
    const mongoAggregation = await mongo.getActivityAnalyticsPipeline();

    return NextResponse.json({
      summary: {
        totalCases: Number(counts.total_cases),
        registeredCases: Number(counts.registered_cases),
        ongoingCases: Number(counts.ongoing_cases),
        resolvedCases: Number(counts.resolved_cases),
        urgentCases: Number(counts.urgent_cases),
        totalLawyers: Number(lawyersCountRes.rows[0]?.total_lawyers || 0),
        totalClients: Number(clientsCountRes.rows[0]?.total_clients || 0),
        upcomingHearings: Number(upcomingHearingsRes.rows[0]?.upcoming_hearings || 0),
      },
      statusDistribution: statusDistRes.rows,
      categoryDistribution: categoryDistRes.rows,
      monthlyRegistrations: monthlyRegistrationsRes.rows,
      lawyerWorkload: lawyerWorkloadRes.rows,
      financialStats: {
        totalSettlements: Number(financialStats.total_settlements),
        totalAgreedSum: Number(financialStats.total_agreed_sum),
        totalPaidSum: Number(financialStats.total_paid_sum),
        totalOutstandingSum: Number(financialStats.total_outstanding_sum),
        completedCount: Number(financialStats.completed_settlements_count),
        partialCount: Number(financialStats.partial_settlements_count),
        pendingCount: Number(financialStats.pending_settlements_count),
        recoveryRatePct: Number(financialStats.total_agreed_sum) > 0 
          ? Number(((Number(financialStats.total_paid_sum) / Number(financialStats.total_agreed_sum)) * 100).toFixed(1))
          : 0,
      },
      resolutionStats: resolutionStatsRes.rows[0],
      // Results of official MongoDB aggregation pipeline
      mongoActivityAggregation: mongoAggregation,
    });
  } catch (error: any) {
    console.error('Analytics aggregation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate database analytics', message: error.message },
      { status: 500 }
    );
  }
}
