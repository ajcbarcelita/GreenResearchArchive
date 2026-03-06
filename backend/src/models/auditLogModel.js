export const listAuditLogs = async (
  db,
  { q, submissionId, changedBy, programCode, oldStatus, newStatus, dateFrom, dateTo } = {},
) => {
  const params = []
  const whereClauses = []

  if (q) {
    params.push(`%${q}%`)
    whereClauses.push(
      `(sal.remarks ILIKE $${params.length}
        OR cg.group_name ILIKE $${params.length}
        OR u.email ILIKE $${params.length}
        OR (u.fname || ' ' || COALESCE(u.mname || ' ', '') || u.lname) ILIKE $${params.length})`,
    )
  }

  if (submissionId) {
    params.push(submissionId)
    whereClauses.push(`sal.submission_id = $${params.length}`)
  }

  if (changedBy) {
    params.push(changedBy)
    whereClauses.push(`sal.changed_by = $${params.length}`)
  }

  if (programCode) {
    params.push(programCode)
    whereClauses.push(`rp.program_code = $${params.length}`)
  }

  if (oldStatus) {
    params.push(oldStatus)
    whereClauses.push(`sal.old_status::text = $${params.length}`)
  }

  if (newStatus) {
    params.push(newStatus)
    whereClauses.push(`sal.new_status::text = $${params.length}`)
  }

  if (dateFrom) {
    params.push(dateFrom)
    whereClauses.push(`sal.changed_at >= $${params.length}`)
  }

  if (dateTo) {
    params.push(dateTo)
    whereClauses.push(`sal.changed_at < $${params.length}::timestamptz + interval '1 day'`)
  }

  const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''

  const result = await db.query(
    `
      SELECT
        sal.log_id,
        sal.submission_id,
        sal.changed_by,
        sal.old_status,
        sal.new_status,
        sal.remarks,
        sal.changed_at,
        s.group_id,
        s.title AS submission_title,
        s.status AS current_status,
        s.version_no,
        cg.group_name,
        rp.program_code,
        rp.program_name,
        u.email AS actor_email,
        u.fname AS actor_fname,
        u.mname AS actor_mname,
        u.lname AS actor_lname,
        rr.role_name AS actor_role
      FROM submission_audit_logs sal
      JOIN submissions s ON s.submission_id = sal.submission_id
      JOIN capstone_groups cg ON cg.group_id = s.group_id
      JOIN ref_degree_programs rp ON rp.program_id = cg.program_id
      JOIN users u ON u.user_id = sal.changed_by
      LEFT JOIN ref_roles rr ON rr.role_id = u.role_id
      ${where}
      ORDER BY sal.changed_at DESC, sal.log_id DESC
    `,
    params,
  )

  return result.rows
}

export const getAuditLogFilterOptions = async (db) => {
  const [programsResult, actorsResult, oldStatusesResult, newStatusesResult] = await Promise.all([
    db.query(
      `
        SELECT DISTINCT rp.program_code
        FROM submission_audit_logs sal
        JOIN submissions s ON s.submission_id = sal.submission_id
        JOIN capstone_groups cg ON cg.group_id = s.group_id
        JOIN ref_degree_programs rp ON rp.program_id = cg.program_id
        WHERE rp.program_code IS NOT NULL
        ORDER BY rp.program_code ASC
      `,
    ),
    db.query(
      `
        SELECT DISTINCT
          u.user_id AS actor_id,
          u.fname,
          u.mname,
          u.lname,
          u.email
        FROM submission_audit_logs sal
        JOIN users u ON u.user_id = sal.changed_by
        ORDER BY u.lname ASC, u.fname ASC
      `,
    ),
    db.query(
      `
        SELECT DISTINCT sal.old_status::text AS status
        FROM submission_audit_logs sal
        WHERE sal.old_status IS NOT NULL
        ORDER BY status ASC
      `,
    ),
    db.query(
      `
        SELECT DISTINCT sal.new_status::text AS status
        FROM submission_audit_logs sal
        WHERE sal.new_status IS NOT NULL
        ORDER BY status ASC
      `,
    ),
  ])

  return {
    programs: programsResult.rows.map((row) => row.program_code),
    actors: actorsResult.rows.map((row) => ({
      actorId: row.actor_id,
      actorName: [row.fname, row.mname, row.lname].filter(Boolean).join(' '),
      actorEmail: row.email,
    })),
    oldStatuses: oldStatusesResult.rows.map((row) => row.status),
    newStatuses: newStatusesResult.rows.map((row) => row.status),
  }
}
