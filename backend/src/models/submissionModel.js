export const findSubmissionById = async (db, submissionId) => {
  const result = await db.query(
    `
      SELECT s.submission_id, s.group_id, s.title, s.abstract, s.keywords, s.version_no, s.status, s.is_locked, s.created_at, s.submitted_at, s.archived_at,
             cg.group_name,
             rp.program_code,
             adv.fname AS adviser_fname,
             adv.lname AS adviser_lname
      FROM submissions s
      LEFT JOIN capstone_groups cg ON cg.group_id = s.group_id
      LEFT JOIN ref_degree_programs rp ON rp.program_id = cg.program_id
      LEFT JOIN users adv ON adv.user_id = cg.group_adviser
      WHERE s.submission_id = $1
      LIMIT 1
    `,
    [submissionId],
  );

  return result.rows[0] || null;
};

export const listSubmissions = async (db, { status, programId, q } = {}) => {
  const params = [];
  const whereClauses = [];

  if (status) {
    params.push(status);
    whereClauses.push(`s.status = $${params.length}`);
  }

  if (programId) {
    params.push(programId);
    whereClauses.push(`cg.program_id = $${params.length}`);
  }

  if (q) {
    params.push(`%${q}%`);
    whereClauses.push(
      `(s.title ILIKE $${params.length} OR s.abstract ILIKE $${params.length} OR s.keywords::text ILIKE $${params.length})`,
    );
  }

  const where = whereClauses.length
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";

  const sql = `
    SELECT s.submission_id, s.group_id, s.title, s.abstract, s.keywords, s.version_no, s.status, s.is_locked, s.created_at, s.submitted_at,
           cg.group_name, cg.program_id,
           rp.program_code,
           adv.fname AS adviser_fname,
           adv.lname AS adviser_lname
           , (
             SELECT string_agg(trim(u.fname || ' ' || COALESCE(u.mname || ' ', '') || u.lname), ', ' ORDER BY u.lname, u.fname)
             FROM group_members gm
             JOIN users u ON u.user_id = gm.student_id
             WHERE gm.group_id = cg.group_id
           ) AS authors
    FROM submissions s
    LEFT JOIN capstone_groups cg ON cg.group_id = s.group_id
    LEFT JOIN ref_degree_programs rp ON rp.program_id = cg.program_id
    LEFT JOIN users adv ON adv.user_id = cg.group_adviser
    ${where}
    ORDER BY s.submitted_at DESC NULLS LAST, s.created_at DESC
  `;

  const result = await db.query(sql, params);
  return result.rows;
};

export const insertSubmission = async (
  db,
  {
    taskId,
    groupId,
    title,
    abstract,
    keywords,
    versionNo,
    status = "Draft",
    isLocked = false,
  },
) => {
  const result = await db.query(
    `
      INSERT INTO submissions (task_id, group_id, title, abstract, keywords, version_no, status, is_locked, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING submission_id, group_id, title, abstract, keywords, version_no, status, is_locked, created_at
    `,
    [taskId, groupId, title, abstract, keywords, versionNo, status, isLocked],
  );

  return result.rows[0];
};

export const findCurrentTask = async (db) => {
  const result = await db.query(
    `
      SELECT t.task_id, t.task_name, t.description, t.due_date, t.term_id,
             at.academic_year, at.term_no, at.start_date, at.end_date
      FROM tasks t
      JOIN academic_terms at ON at.term_id = t.term_id
      WHERE CURRENT_DATE BETWEEN at.start_date AND at.end_date
      ORDER BY t.due_date ASC NULLS LAST
      LIMIT 1
    `,
  );

  if (result.rows[0]) return result.rows[0];

  // Fallback: most recently created task if no active term matches
  const fallback = await db.query(
    `SELECT t.task_id, t.task_name, t.description, t.due_date, t.term_id,
            at.academic_year, at.term_no, at.start_date, at.end_date
     FROM tasks t
     JOIN academic_terms at ON at.term_id = t.term_id
     ORDER BY t.created_at DESC LIMIT 1`,
  );
  return fallback.rows[0] || null;
};

export const findTaskById = async (db, taskId) => {
  const result = await db.query(
    `
      SELECT t.task_id, t.task_name, t.description, t.due_date, t.term_id,
             at.academic_year, at.term_no, at.start_date, at.end_date
      FROM tasks t
      JOIN academic_terms at ON at.term_id = t.term_id
      WHERE t.task_id = $1
      LIMIT 1
    `,
    [taskId],
  );

  return result.rows[0] || null;
};

export const updateSubmissionStatus = async (db, { submissionId, status }) => {
  const result = await db.query(
    `
      UPDATE submissions
      SET status = $1::submission_status,
          submitted_at = CASE
            WHEN $1::submission_status = 'Submitted'::submission_status
            THEN CURRENT_TIMESTAMP
            ELSE submitted_at
          END
      WHERE submission_id = $2
      RETURNING submission_id, status, submitted_at
    `,
    [status, submissionId],
  );

  return result.rows[0] || null;
};

export const updateSubmission = async (
  db,
  { submissionId, title, abstract, keywords, versionNo, isLocked },
) => {
  const result = await db.query(
    `
      UPDATE submissions
      SET title = $1, abstract = $2, keywords = $3, version_no = $4, is_locked = $5
      WHERE submission_id = $6
      RETURNING submission_id, group_id, title, abstract, keywords, version_no, status, is_locked, created_at, submitted_at
    `,
    [title, abstract, keywords, versionNo, isLocked, submissionId],
  );

  return result.rows[0] || null;
};

export const listSubmissionsByGroupId = async (db, groupId) => {
  const result = await db.query(
    `
      SELECT submission_id, task_id, group_id, title, abstract, keywords, version_no, status, is_locked, created_at, submitted_at, archived_at
      FROM submissions
      WHERE group_id = $1
      ORDER BY version_no DESC, created_at DESC
    `,
    [groupId],
  );

  return result.rows;
};

export const findSubmissionByGroupAndTask = async (db, groupId, taskId) => {
  const result = await db.query(
    `
      SELECT submission_id, task_id, group_id, title, abstract, keywords, version_no, status, is_locked, created_at, submitted_at, archived_at
      FROM submissions
      WHERE group_id = $1 AND task_id = $2
      ORDER BY version_no DESC, created_at DESC
      LIMIT 1
    `,
    [groupId, taskId],
  );
  return result.rows[0] || null;
};

export const findLatestModifiedSubmissionByGroupId = async (db, groupId) => {
  const result = await db.query(
    `
      SELECT submission_id, task_id, group_id, title, abstract, keywords, version_no, status, is_locked, created_at, submitted_at, archived_at
      FROM submissions
      WHERE group_id = $1
      ORDER BY COALESCE(submitted_at, created_at) DESC, created_at DESC, version_no DESC
      LIMIT 1
    `,
    [groupId],
  );

  return result.rows[0] || null;
};

export const existsSubmissionVersionForGroupTask = async (
  db,
  { groupId, taskId, versionNo, excludeSubmissionId = null },
) => {
  const params = [groupId, taskId, versionNo];
  let whereExclude = "";

  if (excludeSubmissionId) {
    params.push(excludeSubmissionId);
    whereExclude = `AND submission_id <> $${params.length}`;
  }

  const result = await db.query(
    `
      SELECT 1
      FROM submissions
      WHERE group_id = $1
        AND task_id = $2
        AND version_no = $3
        ${whereExclude}
      LIMIT 1
    `,
    params,
  );

  return result.rowCount > 0;
};

export const getNextSubmissionVersionForGroupTask = async (
  db,
  { groupId, taskId },
) => {
  const result = await db.query(
    `
      SELECT COALESCE(MAX(version_no), 0)::int + 1 AS next_version_no
      FROM submissions
      WHERE group_id = $1 AND task_id = $2
    `,
    [groupId, taskId],
  );

  return Number(result.rows[0]?.next_version_no || 1);
};

export const listResearchFieldsBySubmissionId = async (db, submissionId) => {
  const result = await db.query(
    `
      SELECT rf.field_name
      FROM paper_fields pf
      JOIN ref_research_fields rf ON rf.field_id = pf.field_id
      WHERE pf.submission_id = $1
      ORDER BY rf.field_name ASC
    `,
    [submissionId],
  );

  return result.rows.map((row) => row.field_name).filter(Boolean);
};

export const replaceSubmissionResearchFields = async (
  db,
  { submissionId, researchFields },
) => {
  const normalized = Array.from(
    new Set(
      (researchFields || [])
        .map((entry) => String(entry || "").trim())
        .filter(Boolean),
    ),
  );

  await db.query(
    `
      DELETE FROM paper_fields
      WHERE submission_id = $1
    `,
    [submissionId],
  );

  for (const fieldName of normalized) {
    const existing = await db.query(
      `
        SELECT field_id
        FROM ref_research_fields
        WHERE LOWER(field_name) = LOWER($1)
        LIMIT 1
      `,
      [fieldName],
    );

    let fieldId = existing.rows[0]?.field_id || null;

    if (!fieldId) {
      const inserted = await db.query(
        `
          INSERT INTO ref_research_fields (field_name)
          VALUES ($1)
          RETURNING field_id
        `,
        [fieldName],
      );
      fieldId = inserted.rows[0]?.field_id || null;
    }

    if (fieldId) {
      await db.query(
        `
          INSERT INTO paper_fields (submission_id, field_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [submissionId, fieldId],
      );
    }
  }
};

export const listTasksWithSubmissionStatus = async (db, groupId) => {
  const result = await db.query(
    `
      SELECT
        t.task_id,
        t.task_name,
        t.description,
        t.due_date,
        at2.academic_year,
        at2.term_no,
        at2.start_date,
        at2.end_date,
        s.submission_id,
        s.status     AS submission_status,
        s.version_no AS submission_version_no,
        s.submitted_at,
        CASE
          WHEN CURRENT_DATE BETWEEN at2.start_date AND at2.end_date THEN true
          ELSE false
        END AS is_active_term
      FROM tasks t
      JOIN academic_terms at2 ON at2.term_id = t.term_id
      LEFT JOIN LATERAL (
        SELECT s1.submission_id, s1.status, s1.version_no, s1.submitted_at
        FROM submissions s1
        WHERE s1.task_id = t.task_id
          AND s1.group_id = $1
        ORDER BY s1.version_no DESC, s1.created_at DESC
        LIMIT 1
      ) s ON true
      ORDER BY at2.start_date DESC, t.due_date ASC
    `,
    [groupId],
  );
  return result.rows;
};
