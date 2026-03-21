// Coordinator Queries - Database queries for Coordinator dashboard features
// This file contains all the SQL queries needed to fulfill the Coordinator's view requirements

// Dashboard Queries
export const getSubmissionOverview = `
  SELECT
    status,
    COUNT(*) as count
  FROM submissions
  WHERE status IN ('Draft', 'Submitted', 'Under Review', 'Approved', 'Archived')
  GROUP BY status
  ORDER BY status;
`;

export const getPendingActions = `
  SELECT
    s.submission_id,
    s.title,
    s.status,
    s.submitted_at,
    cg.group_name,
    u.fname || ' ' || u.lname as adviser_name,
    u.email as adviser_email
  FROM submissions s
  JOIN capstone_groups cg ON s.group_id = cg.group_id
  JOIN users u ON cg.group_adviser = u.user_id
  WHERE s.status = 'Under Review'
  ORDER BY s.submitted_at DESC;
`;

export const getComplianceAlerts = `
  SELECT
    s.submission_id,
    s.title,
    s.status,
    s.submitted_at,
    cg.group_name,
    COUNT(sf.file_id) as file_count
  FROM submissions s
  JOIN capstone_groups cg ON s.group_id = cg.group_id
  LEFT JOIN submission_files sf ON s.submission_id = sf.submission_id
  WHERE s.status IN ('Submitted', 'Under Review')
    AND (s.title = '' OR s.abstract = '' OR array_length(s.keywords, 1) IS NULL OR array_length(s.keywords, 1) < 3)
  GROUP BY s.submission_id, s.title, s.status, s.submitted_at, cg.group_name
  HAVING COUNT(sf.file_id) < 2
  ORDER BY s.submitted_at DESC;
`;

// Submissions Management Queries
export const getLiveSubmissions = `
  SELECT
    s.submission_id,
    s.title,
    s.abstract,
    s.status,
    s.version_no,
    s.is_locked,
    s.created_at,
    s.submitted_at,
    s.archived_at,
    cg.group_name,
    cg.group_id,
    cg.group_adviser as adviser_id,
    rdp.program_name,
    rdp.program_code,
    rdp.program_id,
    u.fname || ' ' || u.lname as adviser_name,
    u.email as adviser_email,
    COUNT(gm.student_id) as member_count,
    COUNT(sf.file_id) as file_count
  FROM submissions s
  JOIN capstone_groups cg ON s.group_id = cg.group_id
  JOIN ref_degree_programs rdp ON cg.program_id = rdp.program_id
  JOIN users u ON cg.group_adviser = u.user_id
  LEFT JOIN group_members gm ON cg.group_id = gm.group_id
  LEFT JOIN submission_files sf ON s.submission_id = sf.submission_id
  GROUP BY s.submission_id, s.title, s.abstract, s.status, s.version_no, s.is_locked,
           s.created_at, s.submitted_at, s.archived_at, cg.group_name, cg.group_id, cg.group_adviser,
           rdp.program_name, rdp.program_code, rdp.program_id, u.fname, u.lname, u.email
  ORDER BY s.created_at DESC;
`;

export const getPendingFinalValidation = `
  SELECT
    s.submission_id,
    s.title,
    s.abstract,
    s.status,
    s.submitted_at,
    cg.group_name,
    cg.group_adviser as adviser_id,
    rdp.program_name,
    rdp.program_id,
    u.fname || ' ' || u.lname as adviser_name,
    COUNT(gm.student_id) as member_count
  FROM submissions s
  JOIN capstone_groups cg ON s.group_id = cg.group_id
  JOIN ref_degree_programs rdp ON cg.program_id = rdp.program_id
  JOIN users u ON cg.group_adviser = u.user_id
  LEFT JOIN group_members gm ON cg.group_id = gm.group_id
  WHERE s.status = 'Approved'
  GROUP BY s.submission_id, s.title, s.abstract, s.status, s.submitted_at,
           cg.group_name, cg.group_adviser, rdp.program_name, rdp.program_id, u.fname, u.lname
  ORDER BY s.submitted_at DESC;
`;

export const updateSubmissionStatus = `
  UPDATE submissions
  SET status = $1, submitted_at = CASE WHEN $1 = 'Submitted' THEN CURRENT_TIMESTAMP ELSE submitted_at END,
      archived_at = CASE WHEN $1 = 'Archived' THEN CURRENT_TIMESTAMP ELSE archived_at END
  WHERE submission_id = $2;
`;

export const lockSubmission = `
  UPDATE submissions
  SET is_locked = $1
  WHERE submission_id = $2;
`;

// Repository Management Queries
export const getArchivedSubmissions = `
  SELECT
    s.submission_id,
    s.title,
    s.abstract,
    s.keywords,
    s.version_no,
    s.archived_at,
    cg.group_name,
    rdp.program_name,
    u.fname || ' ' || u.lname as adviser_name,
    COUNT(gm.student_id) as member_count,
    COUNT(sf.file_id) as file_count
  FROM submissions s
  JOIN capstone_groups cg ON s.group_id = cg.group_id
  JOIN ref_degree_programs rdp ON cg.program_id = rdp.program_id
  JOIN users u ON cg.group_adviser = u.user_id
  LEFT JOIN group_members gm ON cg.group_id = gm.group_id
  LEFT JOIN submission_files sf ON s.submission_id = sf.submission_id
  WHERE s.status = 'Archived'
  GROUP BY s.submission_id, s.title, s.abstract, s.keywords, s.version_no, s.archived_at,
           cg.group_name, rdp.program_name, u.fname, u.lname
  ORDER BY s.archived_at DESC;
`;

export const getResearchFields = `
  SELECT field_id, field_name
  FROM ref_research_fields
  ORDER BY field_name;
`;

export const addResearchField = `
  INSERT INTO ref_research_fields (field_name)
  VALUES ($1)
  RETURNING field_id, field_name;
`;

export const updateResearchField = `
  UPDATE ref_research_fields
  SET field_name = $1
  WHERE field_id = $2;
`;

export const deleteResearchField = `
  DELETE FROM ref_research_fields
  WHERE field_id = $1;
`;

export const updateSubmissionMetadata = `
  UPDATE submissions
  SET title = $1, abstract = $2, keywords = $3
  WHERE submission_id = $4;
`;

// Users & Access Queries
export const getAllUsers = `
  SELECT
    u.user_id,
    u.email,
    u.university_id,
    u.fname,
    u.lname,
    u.mname,
    u.is_active,
    u.created_at,
    u.last_login,
    r.role_name,
    rdp.program_name
  FROM users u
  JOIN ref_roles r ON u.role_id = r.role_id
  LEFT JOIN ref_degree_programs rdp ON u.program_id = rdp.program_id
  ORDER BY u.created_at DESC;
`;

export const updateUserRole = `
  UPDATE users
  SET role_id = (SELECT role_id FROM ref_roles WHERE role_name = $1)
  WHERE user_id = $2;
`;

export const getAuditLogs = `
  SELECT
    sal.log_id,
    sal.submission_id,
    sal.old_status,
    sal.new_status,
    sal.remarks,
    sal.changed_at,
    s.title as submission_title,
    u.fname || ' ' || u.lname as changed_by_name,
    u.email as changed_by_email
  FROM submission_audit_logs sal
  JOIN submissions s ON sal.submission_id = s.submission_id
  JOIN users u ON sal.changed_by = u.user_id
  ORDER BY sal.changed_at DESC
  LIMIT 1000;
`;

// Analytics & Reports Queries
export const getKeywordPopularity = `
  SELECT
    (ARRAY_AGG(DISTINCT keyword))[1] as keyword,
    COUNT(*) as frequency
  FROM (
    SELECT DISTINCT unnest(keywords) as keyword
    FROM submissions
    WHERE status = 'Archived' AND keywords IS NOT NULL
  ) subq
  GROUP BY LOWER(keyword)
  ORDER BY frequency DESC
  LIMIT 20;
`;

export const getResearchTrends = `
  SELECT
    rf.field_name,
    COUNT(pf.submission_id) as submission_count,
    COUNT(DISTINCT s.group_id) as group_count
  FROM ref_research_fields rf
  LEFT JOIN paper_fields pf ON rf.field_id = pf.field_id
  LEFT JOIN submissions s ON pf.submission_id = s.submission_id AND s.status = 'Archived'
  GROUP BY rf.field_id, rf.field_name
  ORDER BY submission_count DESC;
`;

export const getAdviserMetrics = `
  SELECT
    u.user_id,
    u.fname || ' ' || u.lname as adviser_name,
    u.email,
    COUNT(DISTINCT cg.group_id) as group_count,
    COUNT(DISTINCT gm.student_id) as student_count,
    COUNT(DISTINCT s.submission_id) as submission_count,
    COUNT(DISTINCT CASE WHEN s.status = 'Approved' THEN s.submission_id END) as approved_count,
    COUNT(DISTINCT CASE WHEN s.status = 'Revision Requested' THEN s.submission_id END) as revision_count
  FROM users u
  LEFT JOIN capstone_groups cg ON u.user_id = cg.group_adviser AND cg.is_active = true
  LEFT JOIN group_members gm ON cg.group_id = gm.group_id
  LEFT JOIN submissions s ON cg.group_id = s.group_id
  WHERE u.role_id = (SELECT role_id FROM ref_roles WHERE LOWER(role_name) = 'faculty')
  GROUP BY u.user_id, u.fname, u.lname, u.email
  ORDER BY group_count DESC;
`;

export const getSubmissionStatusOverTime = `
  SELECT
    DATE_TRUNC('month', s.created_at) as month,
    s.status,
    COUNT(*) as count
  FROM submissions s
  WHERE s.created_at >= CURRENT_DATE - INTERVAL '2 years'
  GROUP BY DATE_TRUNC('month', s.created_at), s.status
  ORDER BY month DESC, s.status;
`;

export const getProgramStatistics = `
  SELECT
    rdp.program_name,
    rdp.program_code,
    COUNT(DISTINCT cg.group_id) as active_groups,
    COUNT(DISTINCT s.submission_id) as total_submissions,
    COUNT(DISTINCT CASE WHEN s.status = 'Archived' THEN s.submission_id END) as archived_submissions
  FROM ref_degree_programs rdp
  LEFT JOIN capstone_groups cg ON rdp.program_id = cg.program_id AND cg.is_active = true
  LEFT JOIN submissions s ON cg.group_id = s.group_id
  GROUP BY rdp.program_id, rdp.program_name, rdp.program_code
  ORDER BY active_groups DESC;
`;

export const getRepositoryHealth = `
  SELECT
    COUNT(DISTINCT s.submission_id) as total_archived,
    COUNT(DISTINCT CASE WHEN s.archived_at >= CURRENT_DATE - INTERVAL '6 months' THEN s.submission_id END) as recent_archives,
    COALESCE(TRUNC(AVG(EXTRACT(EPOCH FROM (s.archived_at - s.created_at))/86400)::numeric), 0)::integer as avg_completion_days,
    COUNT(DISTINCT CASE WHEN s.keywords IS NOT NULL AND array_length(s.keywords, 1) >= 3 THEN s.submission_id END) as well_tagged_submissions,
    COUNT(DISTINCT s.submission_id) as total_submissions_in_repo
  FROM submissions s
  WHERE s.status = 'Archived' AND s.archived_at IS NOT NULL;`;

export const getPerformanceIndicators = `
  SELECT
    'total_submissions' as metric, COUNT(*)::text as value FROM submissions
  UNION ALL
  SELECT 'archived_submissions', COUNT(*)::text FROM submissions WHERE status = 'Archived'
  UNION ALL
  SELECT 'active_groups', COUNT(*)::text FROM capstone_groups WHERE is_active = true
  UNION ALL
  SELECT 'total_users', COUNT(*)::text FROM users WHERE is_active = true
  UNION ALL
  SELECT 'faculty_count', COUNT(*)::text FROM users u JOIN ref_roles r ON u.role_id = r.role_id WHERE LOWER(r.role_name) = 'faculty' AND u.is_active = true
  UNION ALL
  SELECT 'avg_group_size', ROUND(AVG(member_count), 1)::text FROM (
    SELECT COUNT(gm.student_id) as member_count
    FROM capstone_groups cg
    LEFT JOIN group_members gm ON cg.group_id = gm.group_id
    WHERE cg.is_active = true
    GROUP BY cg.group_id
  ) group_sizes;
`;

// Utility queries
export const getSubmissionDetails = (submissionId) => `
  SELECT
    s.*,
    cg.group_name,
    rdp.program_name,
    u.fname || ' ' || u.lname as adviser_name,
    array_agg(DISTINCT rf.field_name) as research_fields
  FROM submissions s
  JOIN capstone_groups cg ON s.group_id = cg.group_id
  JOIN ref_degree_programs rdp ON cg.program_id = rdp.program_id
  JOIN users u ON cg.group_adviser = u.user_id
  LEFT JOIN paper_fields pf ON s.submission_id = pf.submission_id
  LEFT JOIN ref_research_fields rf ON pf.field_id = rf.field_id
  WHERE s.submission_id = ${submissionId}
  GROUP BY s.submission_id, cg.group_name, rdp.program_name, u.fname, u.lname;
`;

export const getSubmissionFiles = (submissionId) => `
  SELECT
    sf.file_id,
    sf.file_name,
    sf.s3_key,
    sf.file_type,
    sf.file_size,
    sf.uploaded_at,
    sf.version_no
  FROM submission_files sf
  WHERE sf.submission_id = ${submissionId}
  ORDER BY sf.uploaded_at DESC;
`;

export const getGroupMembers = (groupId) => `
  SELECT
    u.user_id,
    u.fname || ' ' || u.lname as full_name,
    u.email,
    u.university_id
  FROM group_members gm
  JOIN users u ON gm.student_id = u.user_id
  WHERE gm.group_id = ${groupId}
  ORDER BY u.lname, u.fname;
`;

// Additional queries for frontend filters
export const getPrograms = `
  SELECT
    program_id,
    program_name,
    program_code
  FROM ref_degree_programs
  ORDER BY program_name;
`;

export const getAdvisers = `
  SELECT
    u.user_id,
    u.fname,
    u.lname,
    u.email,
    u.fname || ' ' || u.lname as full_name
  FROM users u
  JOIN ref_roles r ON u.role_id = r.role_id
  WHERE r.role_name = 'faculty'
  ORDER BY u.lname, u.fname;
`;
