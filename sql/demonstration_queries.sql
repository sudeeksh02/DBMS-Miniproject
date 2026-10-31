-- ============================================================================
-- DIVORCE MANAGEMENT SYSTEM (DMS) - ADVANCED SQL DEMONSTRATION QUERIES
-- University DBMS Project - Level 3 Academic Demonstration Suite
-- Target Database: PostgreSQL 16+
-- ============================================================================

-- ============================================================================
-- QUERY 1: INNER JOIN - Active Case Counsel Assignment Directory
-- Concept: INNER JOIN between 4 tables (divorce_cases, case_lawyers, lawyers, users)
-- Purpose: Retrieves current active cases with their assigned counsel details
-- ============================================================================
SELECT 
    c.reference_number,
    c.case_title,
    c.status AS case_status,
    cl.representing_role,
    u.full_name AS lawyer_name,
    l.bar_registration_number,
    l.specialization,
    cl.assigned_at
FROM divorce_cases c
INNER JOIN case_lawyers cl ON c.id = cl.case_id
INNER JOIN lawyers l ON cl.lawyer_id = l.id
INNER JOIN users u ON l.user_id = u.id
WHERE cl.is_active = TRUE
ORDER BY c.reference_number ASC;

-- ============================================================================
-- QUERY 2: LEFT OUTER JOIN - Lawyer Caseload vs Overall Capacity
-- Concept: LEFT JOIN, Aggregation (COUNT, COALESCE), Arithmetic expression
-- Purpose: Analyzes each lawyer's workload regardless of whether they have active cases
-- ============================================================================
SELECT 
    l.id AS lawyer_id,
    u.full_name AS lawyer_name,
    l.specialization,
    l.max_case_capacity,
    COUNT(cl.case_id) AS total_assigned_cases,
    COUNT(CASE WHEN c.status NOT IN ('RESOLVED', 'CLOSED') THEN 1 END) AS active_in_progress_cases,
    (l.max_case_capacity - COUNT(CASE WHEN c.status NOT IN ('RESOLVED', 'CLOSED') THEN 1 END)) AS remaining_capacity
FROM lawyers l
INNER JOIN users u ON l.user_id = u.id
LEFT JOIN case_lawyers cl ON l.id = cl.lawyer_id AND cl.is_active = TRUE
LEFT JOIN divorce_cases c ON cl.case_id = c.id
GROUP BY l.id, u.full_name, l.specialization, l.max_case_capacity
ORDER BY active_in_progress_cases DESC;

-- ============================================================================
-- QUERY 3: MULTI-TABLE JOIN (5 TABLES) - Comprehensive Case Hearing Profile
-- Concept: Multi-table JOIN connecting cases, parties, hearings, lawyers, and users
-- Purpose: Displays court docket with case parties, upcoming dates, and presiding judge
-- ============================================================================
SELECT 
    c.reference_number,
    c.case_title,
    h.hearing_date,
    h.court_room,
    h.judge_name,
    h.hearing_type,
    h.outcome,
    pet.full_name AS petitioner_name,
    resp.full_name AS respondent_name,
    u_lawyer.full_name AS lead_counsel
FROM hearings h
INNER JOIN divorce_cases c ON h.case_id = c.id
LEFT JOIN case_parties pet ON c.id = pet.case_id AND pet.party_role = 'PETITIONER'
LEFT JOIN case_parties resp ON c.id = resp.case_id AND resp.party_role = 'RESPONDENT'
LEFT JOIN lawyers l ON h.assigned_lawyer_id = l.id
LEFT JOIN users u_lawyer ON l.user_id = u_lawyer.id
WHERE h.outcome = 'SCHEDULED'
ORDER BY h.hearing_date ASC;

-- ============================================================================
-- QUERY 4: GROUP BY with HAVING - Lawyers Managing Multiple High-Priority Cases
-- Concept: GROUP BY, COUNT aggregate, HAVING clause filter
-- Purpose: Identifies legal counsel managing more than 1 case with high/urgent priority
-- ============================================================================
SELECT 
    l.id AS lawyer_id,
    u.full_name AS lawyer_name,
    l.bar_registration_number,
    COUNT(c.id) AS urgent_case_count,
    STRING_AGG(c.reference_number, ', ') AS case_references
FROM lawyers l
INNER JOIN users u ON l.user_id = u.id
INNER JOIN case_lawyers cl ON l.id = cl.lawyer_id
INNER JOIN divorce_cases c ON cl.case_id = c.id
WHERE c.priority IN ('HIGH', 'URGENT') 
  AND c.status NOT IN ('RESOLVED', 'CLOSED')
GROUP BY l.id, u.full_name, l.bar_registration_number
HAVING COUNT(c.id) >= 1
ORDER BY urgent_case_count DESC;

-- ============================================================================
-- QUERY 5: FINANCIAL AGGREGATE FUNCTIONS (SUM, AVG, MIN, MAX, COUNT)
-- Concept: Aggregate functions across settlement and payment entities
-- Purpose: Summarizes institutional financial metrics across divorce settlements
-- ============================================================================
SELECT 
    s.settlement_type,
    COUNT(s.id) AS total_settlements_count,
    ROUND(SUM(s.total_agreed_amount), 2) AS aggregate_agreed_settlement_sum,
    ROUND(AVG(s.total_agreed_amount), 2) AS average_settlement_amount,
    ROUND(MIN(s.total_agreed_amount), 2) AS minimum_settlement_amount,
    ROUND(MAX(s.total_agreed_amount), 2) AS maximum_settlement_amount,
    ROUND(AVG(s.monthly_alimony), 2) AS average_monthly_alimony
FROM settlements s
GROUP BY s.settlement_type
ORDER BY aggregate_agreed_settlement_sum DESC;

-- ============================================================================
-- QUERY 6: NESTED SUBQUERY (IN Operator) - Cases Having Past Hearing Adjournments
-- Concept: Subquery returning scalar set used inside IN predicate
-- Purpose: Finds divorce cases that experienced procedural delays due to adjournments
-- ============================================================================
SELECT 
    c.id,
    c.reference_number,
    c.case_title,
    c.status,
    c.presiding_court
FROM divorce_cases c
WHERE c.id IN (
    SELECT DISTINCT h.case_id
    FROM hearings h
    WHERE h.outcome = 'ADJOURNED'
);

-- ============================================================================
-- QUERY 7: CORRELATED SUBQUERY - Cases Exceeding Category Average Duration
-- Concept: Correlated subquery referencing outer table (c1.divorce_category = c2.divorce_category)
-- Purpose: Identifies cases pending longer than the average filing duration in their category
-- ============================================================================
SELECT 
    c1.reference_number,
    c1.case_title,
    c1.divorce_category,
    (CURRENT_DATE - c1.filing_date) AS days_pending
FROM divorce_cases c1
WHERE (CURRENT_DATE - c1.filing_date) > (
    SELECT AVG(CURRENT_DATE - c2.filing_date)
    FROM divorce_cases c2
    WHERE c2.divorce_category = c1.divorce_category
)
ORDER BY days_pending DESC;

-- ============================================================================
-- QUERY 8: EXISTS PREDICATE - Divorce Cases with Child Custody Arrangements
-- Concept: EXISTS clause with correlated foreign key matching
-- Purpose: Filters cases where minor children require custodial oversight
-- ============================================================================
SELECT 
    c.reference_number,
    c.case_title,
    c.status,
    c.priority
FROM divorce_cases c
WHERE EXISTS (
    SELECT 1 
    FROM custody_arrangements ca
    WHERE ca.case_id = c.id
      AND ca.number_of_children > 0
);

-- ============================================================================
-- QUERY 9: NOT EXISTS - Cases Awaiting Financial Settlement Filing
-- Concept: NOT EXISTS to find missing child records in parent-child relationship
-- Purpose: Identifies active cases that have not yet formulated settlement terms
-- ============================================================================
SELECT 
    c.reference_number,
    c.case_title,
    c.filing_date,
    c.status
FROM divorce_cases c
WHERE c.status NOT IN ('RESOLVED', 'CLOSED')
  AND NOT EXISTS (
    SELECT 1 
    FROM settlements s
    WHERE s.case_id = c.id
);

-- ============================================================================
-- QUERY 10: COMPLEX CASE EXPRESSION - Case Urgency and Compliance Status
-- Concept: Multi-branch conditional CASE evaluating dates, priority and status
-- Purpose: Assigns dynamic administrative escalation flags for court clerks
-- ============================================================================
SELECT 
    c.reference_number,
    c.case_title,
    c.status,
    c.priority,
    (CURRENT_DATE - c.filing_date) AS days_since_filing,
    CASE 
        WHEN c.status = 'RESOLVED' THEN 'Case Concluded (No Escalation)'
        WHEN c.priority = 'URGENT' AND (CURRENT_DATE - c.filing_date) > 30 THEN 'CRITICAL: High Priority Exceeding 30 Days'
        WHEN c.status = 'REGISTERED' AND (CURRENT_DATE - c.filing_date) > 10 THEN 'WARNING: Summons Issuance Overdue'
        WHEN c.status = 'DOCUMENTATION_PENDING' THEN 'ACTION REQUIRED: Client Affidavits Outstanding'
        WHEN c.status = 'HEARING_SCHEDULED' THEN 'ACTIVE: Court Appearance Imminent'
        ELSE 'ROUTINE: Normal Judicial Track'
    END AS administrative_flag
FROM divorce_cases c
ORDER BY days_since_filing DESC;

-- ============================================================================
-- QUERY 11: DATE MANIPULATION & TIME INTERVAL - Hearings in Next 14 Days
-- Concept: Date arithmetic, INTERVAL expressions, CURRENT_TIMESTAMP
-- Purpose: Generates upcoming two-week court docket for bailiffs and advocates
-- ============================================================================
SELECT 
    h.id AS hearing_id,
    c.reference_number,
    c.case_title,
    h.hearing_date,
    TO_CHAR(h.hearing_date, 'DD-Mon-YYYY HH12:MI AM') AS formatted_hearing_time,
    h.court_room,
    h.judge_name,
    DATE_PART('day', h.hearing_date - CURRENT_TIMESTAMP) AS days_until_hearing
FROM hearings h
JOIN divorce_cases c ON h.case_id = c.id
WHERE h.hearing_date BETWEEN CURRENT_TIMESTAMP AND (CURRENT_TIMESTAMP + INTERVAL '14 days')
  AND h.outcome = 'SCHEDULED'
ORDER BY h.hearing_date ASC;

-- ============================================================================
-- QUERY 12: WINDOW FUNCTION (ROW_NUMBER & DENSE_RANK) - Lawyer Experience Ranking
-- Concept: Analytic window functions OVER (PARTITION BY ... ORDER BY ...)
-- Purpose: Ranks lawyers within their respective legal specialization fields
-- ============================================================================
SELECT 
    u.full_name AS lawyer_name,
    l.specialization,
    l.years_experience,
    l.hourly_rate,
    ROW_NUMBER() OVER (ORDER BY l.years_experience DESC) AS overall_seniority_rank,
    DENSE_RANK() OVER (PARTITION BY l.specialization ORDER BY l.hourly_rate DESC) AS rate_rank_in_specialty
FROM lawyers l
JOIN users u ON l.user_id = u.id;

-- ============================================================================
-- QUERY 13: WINDOW FUNCTION (SUM OVER) - Running Total of Settlement Collections
-- Concept: Cumulative analytic window function SUM(...) OVER (ORDER BY ...)
-- Purpose: Computes running financial recovery ledger across all recorded payments
-- ============================================================================
SELECT 
    p.transaction_reference,
    p.payment_date,
    c.reference_number,
    p.amount_paid,
    SUM(p.amount_paid) OVER (ORDER BY p.payment_date ASC, p.id ASC) AS cumulative_recovered_total
FROM payments p
JOIN settlements s ON p.settlement_id = s.id
JOIN divorce_cases c ON s.case_id = c.id
ORDER BY p.payment_date ASC;

-- ============================================================================
-- QUERY 14: SET OPERATION (UNION) - Consolidated Contact Book of Litigants & Advocates
-- Concept: UNION operator combining result sets with identical projection types
-- Purpose: Generates master directory of all phone/email contacts for registry notices
-- ============================================================================
SELECT 
    u.full_name AS contact_name,
    u.email AS contact_email,
    u.phone_number AS contact_phone,
    'Advocate / Legal Counsel' AS stakeholder_type
FROM lawyers l
JOIN users u ON l.user_id = u.id

UNION

SELECT 
    cp.full_name AS contact_name,
    cp.email AS contact_email,
    cp.phone_number AS contact_phone,
    ('Litigant (' || cp.party_role || ')') AS stakeholder_type
FROM case_parties cp
WHERE cp.email IS NOT NULL
ORDER BY contact_name ASC;

-- ============================================================================
-- QUERY 15: COMPLEX SUBQUERY WITH HAVING - Custody Arranged with High Maintenance
-- Concept: Nested subquery, aggregation, JOIN, filter on calculated parent metrics
-- Purpose: Finds child custody records where monthly support exceeds the citywide average
-- ============================================================================
SELECT 
    c.reference_number,
    c.case_title,
    ca.custody_type,
    ca.number_of_children,
    ca.monthly_support_amount,
    ca.visitation_schedule
FROM custody_arrangements ca
JOIN divorce_cases c ON ca.case_id = c.id
WHERE ca.monthly_support_amount > (
    SELECT AVG(monthly_support_amount) 
    FROM custody_arrangements
)
ORDER BY ca.monthly_support_amount DESC;

-- ============================================================================
-- QUERY 16: ADVANCED AUDIT TRAIL - Historical Status Progression per Case
-- Concept: Self-referential status audit log tracking timing between transitions
-- Purpose: Measures procedural latency between consecutive case milestones
-- ============================================================================
SELECT 
    c.reference_number,
    c.case_title,
    h.previous_status,
    h.new_status,
    h.reason,
    h.changed_at,
    LAG(h.changed_at) OVER (PARTITION BY h.case_id ORDER BY h.changed_at ASC) AS prior_transition_time,
    ROUND(EXTRACT(EPOCH FROM (h.changed_at - LAG(h.changed_at) OVER (PARTITION BY h.case_id ORDER BY h.changed_at ASC))) / 86400.0, 1) AS days_in_previous_stage
FROM case_status_history h
JOIN divorce_cases c ON h.case_id = c.id
ORDER BY c.reference_number ASC, h.changed_at ASC;
