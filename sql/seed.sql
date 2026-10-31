-- ============================================================================
-- DIVORCE MANAGEMENT SYSTEM (DMS) - SYNTHETIC SEED DATA (DML)
-- Realistic academic benchmark dataset
-- Passwords hashed with bcrypt (Default password for all demo accounts: 'Password123!')
-- Hash: $2b$10$wE0rNeqYm8Oq5x3z7f6p.eC0P9kM8gWfX4p0e1gY3sT2d8mJq0k12
-- ============================================================================

-- 1. USERS SEED (Admin, Lawyers, Clients)
INSERT INTO users (id, email, password_hash, role, full_name, phone_number, is_active, created_at)
VALUES 
    -- Admin
    ('usr-admin-001', 'admin@divorcems.gov.in', '$2b$10$wE0rNeqYm8Oq5x3z7f6p.eC0P9kM8gWfX4p0e1gY3sT2d8mJq0k12', 'ADMIN', 'Advocate Rajeshwari Sen (Registrar)', '+91 98765 43210', TRUE, NOW() - INTERVAL '90 days'),
    -- Lawyers
    ('usr-law-001', 'vikram.mehta@legalfirm.in', '$2b$10$wE0rNeqYm8Oq5x3z7f6p.eC0P9kM8gWfX4p0e1gY3sT2d8mJq0k12', 'LAWYER', 'Adv. Vikram Mehta', '+91 98201 11223', TRUE, NOW() - INTERVAL '80 days'),
    ('usr-law-002', 'ananya.deshmukh@lawchambers.in', '$2b$10$wE0rNeqYm8Oq5x3z7f6p.eC0P9kM8gWfX4p0e1gY3sT2d8mJq0k12', 'LAWYER', 'Adv. Ananya Deshmukh', '+91 98450 33445', TRUE, NOW() - INTERVAL '75 days'),
    ('usr-law-003', 'kavita.sharma@familyadvocates.org', '$2b$10$wE0rNeqYm8Oq5x3z7f6p.eC0P9kM8gWfX4p0e1gY3sT2d8mJq0k12', 'LAWYER', 'Adv. Kavita Sharma', '+91 97110 55667', TRUE, NOW() - INTERVAL '70 days'),
    -- Clients
    ('usr-cli-001', 'arjun.kapoor@example.com', '$2b$10$wE0rNeqYm8Oq5x3z7f6p.eC0P9kM8gWfX4p0e1gY3sT2d8mJq0k12', 'CLIENT', 'Arjun Kapoor', '+91 99001 23456', TRUE, NOW() - INTERVAL '60 days'),
    ('usr-cli-002', 'priya.sharma@example.com', '$2b$10$wE0rNeqYm8Oq5x3z7f6p.eC0P9kM8gWfX4p0e1gY3sT2d8mJq0k12', 'CLIENT', 'Priya Sharma Kapoor', '+91 99002 34567', TRUE, NOW() - INTERVAL '60 days'),
    ('usr-cli-003', 'rohit.verma@example.com', '$2b$10$wE0rNeqYm8Oq5x3z7f6p.eC0P9kM8gWfX4p0e1gY3sT2d8mJq0k12', 'CLIENT', 'Rohit Verma', '+91 99003 45678', TRUE, NOW() - INTERVAL '45 days'),
    ('usr-cli-004', 'sneha.iyer@example.com', '$2b$10$wE0rNeqYm8Oq5x3z7f6p.eC0P9kM8gWfX4p0e1gY3sT2d8mJq0k12', 'CLIENT', 'Sneha Iyer Verma', '+91 99004 56789', TRUE, NOW() - INTERVAL '45 days')
ON CONFLICT (id) DO NOTHING;

-- 2. LAWYERS SEED
INSERT INTO lawyers (id, user_id, bar_registration_number, specialization, years_experience, office_address, hourly_rate, max_case_capacity)
VALUES
    ('law-001', 'usr-law-001', 'BCI/DEL/2012/8492', 'Matrimonial Litigation & Mediation', 14, 'Chamber 402, High Court Annex, New Delhi', 3500.00, 15),
    ('law-002', 'usr-law-002', 'BCI/MAH/2015/3910', 'Child Custody & Complex Asset Division', 11, 'Level 6, Nariman Point Towers, Mumbai', 4000.00, 12),
    ('law-003', 'usr-law-003', 'BCI/KAR/2018/1105', 'Mutual Consent & Alimony Settlements', 8, 'Suite 12, Cunningham Road Chambers, Bengaluru', 2800.00, 20)
ON CONFLICT (id) DO NOTHING;

-- 3. CLIENTS SEED
INSERT INTO clients (id, user_id, national_id, address, occupation, annual_income)
VALUES
    ('cli-001', 'usr-cli-001', 'AADHAAR-8129-4401', 'Flat 402, Green Acres, Indiranagar, Bengaluru', 'Senior Software Architect', 2800000.00),
    ('cli-002', 'usr-cli-002', 'AADHAAR-7712-9903', 'Villa 14, Palm Meadows, Whitefield, Bengaluru', 'Corporate Marketing Director', 2200000.00),
    ('cli-003', 'usr-cli-003', 'AADHAAR-6391-2244', 'B-102, Silver Oak Towers, Powai, Mumbai', 'Investment Banker', 3400000.00),
    ('cli-004', 'usr-cli-004', 'AADHAAR-5520-8811', 'A-304, Sea Breeze Apts, Bandra West, Mumbai', 'Architect & Interior Designer', 1800000.00)
ON CONFLICT (id) DO NOTHING;

-- 4. CASES SEED
INSERT INTO divorce_cases (
    id, reference_number, case_title, divorce_category, filing_date, 
    marriage_date, marriage_place, separation_date, status, priority, 
    presiding_court, resolution_date, notes
)
VALUES
    (
        'cas-001', 'DIV-2026-0001', 'Arjun Kapoor vs Priya Sharma Kapoor', 
        'Mutual Consent (Section 13B)', CURRENT_DATE - INTERVAL '60 days',
        '2018-11-20', 'Bengaluru Palace Grounds', CURRENT_DATE - INTERVAL '380 days',
        'SETTLEMENT_NEGOTIATION', 'HIGH', 'Principal Family Court, Hall 2', NULL,
        'Both parties seek amicable separation under Section 13B with shared parenting and agreed asset division.'
    ),
    (
        'cas-002', 'DIV-2026-0002', 'Rohit Verma vs Sneha Iyer Verma', 
        'Contested - Irretrievable Breakdown', CURRENT_DATE - INTERVAL '45 days',
        '2016-04-15', 'Taj Lands End, Mumbai', CURRENT_DATE - INTERVAL '400 days',
        'HEARING_SCHEDULED', 'URGENT', 'Family Court Bandra, Division 4', NULL,
        'Contested divorce petition involving child custody of 7-year-old child and commercial property valuation.'
    ),
    (
        'cas-003', 'DIV-2026-0003', 'Devendra Joshi vs Meenakshi Joshi', 
        'Mutual Consent (Section 13B)', CURRENT_DATE - INTERVAL '90 days',
        '2014-02-10', 'Pune Cantonment Hall', CURRENT_DATE - INTERVAL '500 days',
        'RESOLVED', 'MEDIUM', 'Family Court Shivajinagar, Pune', CURRENT_DATE - INTERVAL '10 days',
        'Final decree of divorce granted upon comprehensive execution of alimony settlement and mutual consent terms.'
    ),
    (
        'cas-004', 'DIV-2026-0004', 'Siddharth Nair vs Dr. Radhika Nair', 
        'Contested - Cruelty & Desertion', CURRENT_DATE - INTERVAL '25 days',
        '2020-01-18', 'Ernakulam Town Hall, Kochi', CURRENT_DATE - INTERVAL '200 days',
        'MEDIATION', 'MEDIUM', 'Family Court Ernakulam', NULL,
        'Referred to court-annexed mediation center for exploring reconciliation or settled terms.'
    ),
    (
        'cas-005', 'DIV-2026-0005', 'Kunal Malhotra vs Tanya Malhotra', 
        'Mutual Consent (Section 13B)', CURRENT_DATE - INTERVAL '15 days',
        '2021-06-25', 'The Leela, Gurugram', CURRENT_DATE - INTERVAL '210 days',
        'DOCUMENTATION_PENDING', 'LOW', 'District Court Complex, Gurugram', NULL,
        'Awaiting notarized financial affidavits and joint bank account separation certificates.'
    ),
    (
        'cas-006', 'DIV-2026-0006', 'Manish Bansal vs Ritu Bansal', 
        'Contested - Mutual Incompatibility', CURRENT_DATE - INTERVAL '5 days',
        '2022-12-10', 'Chandigarh Club Hall', CURRENT_DATE - INTERVAL '150 days',
        'REGISTERED', 'HIGH', 'District & Family Court, Chandigarh', NULL,
        'Initial notice issued to respondent. First appearance date pending allocation.'
    )
ON CONFLICT (id) DO NOTHING;

-- 5. CASE PARTIES SEED
INSERT INTO case_parties (id, case_id, client_id, party_role, full_name, gender, dateOfBirth, email, phone_number, current_address, employment, monthly_income)
VALUES
    -- Case 1 parties
    ('pty-001', 'cas-001', 'cli-001', 'PETITIONER', 'Arjun Kapoor', 'MALE', '1989-05-14', 'arjun.kapoor@example.com', '+91 99001 23456', 'Indiranagar, Bengaluru', 'VP Engineering, CloudTech', 230000.00),
    ('pty-002', 'cas-001', 'cli-002', 'RESPONDENT', 'Priya Sharma Kapoor', 'FEMALE', '1991-08-22', 'priya.sharma@example.com', '+91 99002 34567', 'Whitefield, Bengaluru', 'Director Brand Marketing', 185000.00),
    -- Case 2 parties
    ('pty-003', 'cas-002', 'cli-003', 'PETITIONER', 'Rohit Verma', 'MALE', '1987-11-03', 'rohit.verma@example.com', '+91 99003 45678', 'Powai, Mumbai', 'Partner, Global Equities', 280000.00),
    ('pty-004', 'cas-002', 'cli-004', 'RESPONDENT', 'Sneha Iyer Verma', 'FEMALE', '1990-03-19', 'sneha.iyer@example.com', '+91 99004 56789', 'Bandra West, Mumbai', 'Principal Architect', 150000.00),
    -- Case 3 parties
    ('pty-005', 'cas-003', NULL, 'PETITIONER', 'Devendra Joshi', 'MALE', '1985-09-12', 'devendra.j@example.com', '+91 98111 22334', 'Kothrud, Pune', 'Business Owner', 210000.00),
    ('pty-006', 'cas-003', NULL, 'RESPONDENT', 'Meenakshi Joshi', 'FEMALE', '1988-01-30', 'meenakshi.j@example.com', '+91 98111 33445', 'Aundh, Pune', 'Professor of Economics', 120000.00)
ON CONFLICT (id) DO NOTHING;

-- 6. CASE LAWYERS SEED
INSERT INTO case_lawyers (id, case_id, lawyer_id, representing_role, assigned_at, is_lead_counsel, is_active)
VALUES
    ('csl-001', 'cas-001', 'law-003', 'PETITIONER', NOW() - INTERVAL '58 days', TRUE, TRUE),
    ('csl-002', 'cas-001', 'law-001', 'RESPONDENT', NOW() - INTERVAL '58 days', TRUE, TRUE),
    ('csl-003', 'cas-002', 'law-002', 'PETITIONER', NOW() - INTERVAL '44 days', TRUE, TRUE),
    ('csl-004', 'cas-002', 'law-001', 'RESPONDENT', NOW() - INTERVAL '40 days', TRUE, TRUE),
    ('csl-005', 'cas-003', 'law-003', 'PETITIONER', NOW() - INTERVAL '88 days', TRUE, FALSE),
    ('csl-006', 'cas-004', 'law-002', 'PETITIONER', NOW() - INTERVAL '24 days', TRUE, TRUE),
    ('csl-007', 'cas-005', 'law-001', 'PETITIONER', NOW() - INTERVAL '14 days', TRUE, TRUE),
    ('csl-008', 'cas-006', 'law-003', 'PETITIONER', NOW() - INTERVAL '4 days', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 7. HEARINGS SEED
INSERT INTO hearings (
    id, case_id, assigned_lawyer_id, hearing_date, court_room, judge_name, 
    hearing_type, outcome, summary_notes, next_hearing_date
)
VALUES
    (
        'hrg-001', 'cas-001', 'law-003', NOW() - INTERVAL '30 days', 'Family Court Hall 2', 
        'Hon. Justice K. Narayanan', 'PRELIMINARY', 'CONCLUDED', 
        'Both parties confirmed statement of mutual consent. Cooling-off period reduction petition filed.',
        NOW() + INTERVAL '12 days'
    ),
    (
        'hrg-002', 'cas-001', 'law-003', NOW() + INTERVAL '12 days', 'Family Court Hall 2', 
        'Hon. Justice K. Narayanan', 'EVIDENCE_PRESENTATION', 'SCHEDULED', 
        'Submission of final settlement agreement and joint affidavit.', NULL
    ),
    (
        'hrg-003', 'cas-002', 'law-002', NOW() - INTERVAL '15 days', 'Division Bench 4', 
        'Hon. Justice Sunita Deshpande', 'PRELIMINARY', 'ADJOURNED', 
        'Counsel for respondent requested time to examine asset disclosure statement.',
        NOW() + INTERVAL '5 days'
    ),
    (
        'hrg-004', 'cas-002', 'law-002', NOW() + INTERVAL '5 days', 'Division Bench 4', 
        'Hon. Justice Sunita Deshpande', 'CROSS_EXAMINATION', 'SCHEDULED', 
        'Cross-examination on valuation of joint residential property in Powai.', NULL
    ),
    (
        'hrg-005', 'cas-003', 'law-003', NOW() - INTERVAL '10 days', 'Court Hall 1', 
        'Hon. Justice V. Patil', 'JUDGMENT_PRONOUNCEMENT', 'ORDER_PASSED', 
        'Final decree of divorce granted. Full settlement receipt placed on judicial record.', NULL
    ),
    (
        'hrg-006', 'cas-004', 'law-002', NOW() + INTERVAL '18 days', 'Mediation Chamber B', 
        'Mediator Smt. Uma Swaminathan', 'MEDIATION_SESSION', 'SCHEDULED', 
        'Second joint mediation sitting for custodial time sharing.', NULL
    )
ON CONFLICT (id) DO NOTHING;

-- 8. SETTLEMENTS SEED
INSERT INTO settlements (
    id, case_id, settlement_type, total_agreed_amount, monthly_alimony, 
    alimony_tenure_months, payment_status, terms_conditions, settlement_date
)
VALUES
    (
        'stl-001', 'cas-001', 'HYBRID', 4500000.00, 75000.00, 36, 'PARTIALLY_PAID',
        'Lump sum of Rs. 45 Lakhs towards property relinquishment plus monthly maintenance of Rs. 75,000 for 36 months.',
        CURRENT_DATE - INTERVAL '20 days'
    ),
    (
        'stl-002', 'cas-002', 'LUMP_SUM', 8000000.00, 0.00, 0, 'PENDING',
        'Proposed full and final one-time settlement towards all past, present and future claims.',
        NULL
    ),
    (
        'stl-003', 'cas-003', 'LUMP_SUM', 3500000.00, 0.00, 0, 'COMPLETED',
        'Mutual agreed full and final settlement. Encashment confirmed via judicial demand draft.',
        CURRENT_DATE - INTERVAL '15 days'
    )
ON CONFLICT (id) DO NOTHING;

-- 9. PAYMENTS SEED
INSERT INTO payments (id, settlement_id, amount_paid, payment_date, payment_method, transaction_reference, receipt_notes)
VALUES
    ('pay-001', 'stl-001', 2500000.00, NOW() - INTERVAL '18 days', 'RTGS / Bank Transfer', 'TXN-HDFC-9928172635', 'First tranche of agreed lump-sum settlement.'),
    ('pay-002', 'stl-001', 75000.00, NOW() - INTERVAL '5 days', 'NEFT', 'TXN-ICICI-1102938475', 'Month 1 Alimony maintenance payment.'),
    ('pay-003', 'stl-003', 3500000.00, NOW() - INTERVAL '14 days', 'Demand Draft', 'DD-SBI-8827361928', 'Full and final settlement demand draft deposited in court registry.')
ON CONFLICT (id) DO NOTHING;

-- 10. CHILD CUSTODY SEED
INSERT INTO custody_arrangements (
    id, case_id, custody_type, number_of_children, children_details, 
    visitation_schedule, monthly_support_amount, special_conditions, is_agreed
)
VALUES
    (
        'cst-001', 'cas-001', 'JOINT_LEGAL', 1, 
        'Aarav Kapoor, Age 6, Enrolled in The International School Bangalore',
        'Alternate weekends (Friday 5 PM to Sunday 6 PM) and 50% of annual school vacations with Petitioner.',
        40000.00, 'Both parents must give mutual consent for out-of-country travel and schooling decisions.',
        TRUE
    ),
    (
        'cst-002', 'cas-002', 'SHARED_PHYSICAL', 1,
        'Diya Verma, Age 7, Bombay Scottish School, Powai',
        'Weekdays with Respondent mother, alternate extended weekends with Petitioner father.',
        55000.00, 'Education and specialized health insurance costs shared equally (50:50).',
        FALSE
    )
ON CONFLICT (id) DO NOTHING;

-- 11. CASE STATUS HISTORY SEED
INSERT INTO case_status_history (id, case_id, previous_status, new_status, changed_by_user_id, reason, changed_at)
VALUES
    ('hsh-001', 'cas-001', 'REGISTERED', 'UNDER_REVIEW', 'usr-admin-001', 'Initial verification of marriage documents', NOW() - INTERVAL '55 days'),
    ('hsh-002', 'cas-001', 'UNDER_REVIEW', 'MEDIATION', 'usr-admin-001', 'Referred to court counselor for reconciliation sitting', NOW() - INTERVAL '40 days'),
    ('hsh-003', 'cas-001', 'MEDIATION', 'SETTLEMENT_NEGOTIATION', 'usr-law-003', 'Both parties agreed on mutual separation terms', NOW() - INTERVAL '22 days'),
    ('hsh-004', 'cas-002', 'REGISTERED', 'HEARING_SCHEDULED', 'usr-admin-001', 'Filing admitted and first summons issued', NOW() - INTERVAL '42 days'),
    ('hsh-005', 'cas-003', 'REGISTERED', 'HEARING_SCHEDULED', 'usr-admin-001', 'First motion registered', NOW() - INTERVAL '85 days'),
    ('hsh-006', 'cas-003', 'HEARING_SCHEDULED', 'AWAITING_FINAL_ORDER', 'usr-law-003', 'Second motion arguments concluded', NOW() - INTERVAL '18 days'),
    ('hsh-007', 'cas-003', 'AWAITING_FINAL_ORDER', 'RESOLVED', 'usr-admin-001', 'Final decree of divorce signed by presiding judge', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- 12. LEGAL RESOURCES SEED (For pgvector Semantic Retrieval)
INSERT INTO legal_resources (id, title, category, citation, content, summary, tags, embedding)
VALUES
    (
        'res-001',
        'Mutual Consent Divorce Procedure Under Hindu Marriage Act Section 13B',
        'STATUTE',
        'Section 13B, Hindu Marriage Act, 1955',
        'A petition for dissolution of marriage by a decree of divorce may be presented to the district court by both the parties to a marriage together on the ground that they have been living separately for a period of one year or more, that they have not been able to live together and that they have mutually agreed that the marriage should be dissolved. On motion made by both parties between 6 to 18 months after filing (waivable under Supreme Court Amardeep Singh precedent), court grants decree.',
        'Explains statutory criteria, separation period requirement and the 6-month cooling off waiver for mutual consent divorce.',
        ARRAY['mutual consent', 'section 13b', 'cooling off waiver', 'hindu marriage act', 'amicable separation'],
        ARRAY[0.12, 0.45, 0.82, -0.31, 0.54, 0.19, -0.05, 0.67, 0.23, 0.41, 0.15, -0.22, 0.38, 0.71, 0.11, 0.04]
    ),
    (
        'res-002',
        'Judicial Guidelines for Determining Alimony and Maintenance (Rajnesh v. Neha)',
        'PRECEDENT',
        'Supreme Court of India (2020) 10 SCC 733',
        'The Supreme Court laid down comprehensive guidelines for uniform calculation of interim and permanent maintenance. Mandatory disclosure of assets and liabilities through standardized affidavit. Factors include status of parties, reasonable needs of wife and children, applicant income and capacity, liabilities, standard of living enjoyed during matrimonial cohabitation.',
        'Establishes binding formula and mandatory disclosure of assets/liabilities for maintenance determination.',
        ARRAY['alimony', 'maintenance', 'rajnesh v neha', 'income affidavit', 'financial disclosure'],
        ARRAY[0.34, 0.78, 0.12, 0.55, -0.19, 0.44, 0.62, 0.11, -0.28, 0.81, 0.33, 0.05, 0.49, 0.27, -0.14, 0.68]
    ),
    (
        'res-003',
        'Welfare of the Child Principle in Custody and Guardianship Decisions',
        'PROCEDURAL_GUIDE',
        'Guardians and Wards Act, 1890 Section 17 & Hindu Minority and Guardianship Act 1956 Section 13',
        'In deciding custody matters, the paramount consideration is exclusively the welfare of the minor child. Financial superiority of one parent does not automatically entitle them to custody. Courts examine emotional bonding, age, educational continuity, moral upbringing, child preference if intelligent enough, and healthy parental visitation access to ensure child is not alienated from either parent.',
        'Principles governing child custody disputes prioritizing child welfare over parental rights.',
        ARRAY['child custody', 'welfare of child', 'visitation rights', 'joint custody', 'guardianship'],
        ARRAY[0.65, 0.22, 0.41, 0.88, 0.03, -0.37, 0.19, 0.51, 0.74, 0.18, -0.11, 0.49, 0.22, 0.63, 0.35, -0.29]
    ),
    (
        'res-004',
        'Comprehensive Settlement Agreement Template for Matrimonial Separation',
        'DOCUMENT_TEMPLATE',
        'Family Court Mediation Rulebook Sample Form VII',
        'Standard draft agreement covering: 1. Declaration of irrevocable breakdown. 2. Waiver of claims past, present, future. 3. Real estate and movable asset division. 4. Gold and jewellery streedhan return schedule. 5. Child custody, primary residence and visitation protocol. 6. Payment schedule of permanent alimony with penal default clause. 7. Undertaking to withdraw all pending civil/criminal complaints.',
        'Complete clauses checklist for drafting binding divorce settlement agreements.',
        ARRAY['template', 'settlement agreement', 'streedhan', 'clauses', 'asset division'],
        ARRAY[0.19, 0.51, 0.73, 0.24, 0.62, 0.35, -0.12, 0.48, 0.39, 0.58, 0.29, -0.08, 0.61, 0.44, 0.17, 0.32]
    ),
    (
        'res-005',
        'Special Marriage Act Section 28 - Divorce by Mutual Consent for Civil Marriages',
        'STATUTE',
        'Special Marriage Act, 1954 Section 28',
        'Applies to civil marriages registered irrespective of religion. Parties must have lived separately for not less than one year, mutually agree that marriage cannot be salvaged. Petition presented jointly in district court having jurisdiction where marriage was solemnized or where respondent resides or where parties last resided together.',
        'Legal provisions and jurisdictional requirements for divorce under the Special Marriage Act.',
        ARRAY['special marriage act', 'civil marriage', 'secular divorce', 'section 28', 'jurisdiction'],
        ARRAY[0.28, 0.41, 0.69, -0.15, 0.47, 0.26, 0.08, 0.59, 0.31, 0.49, 0.18, -0.14, 0.42, 0.65, 0.21, 0.12]
    )
ON CONFLICT (id) DO NOTHING;
