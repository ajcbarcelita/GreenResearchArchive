export const findSubmissionById = async (db, submissionId) => {
  const result = await db.query(
    `
      SELECT s.submission_id, s.group_id, s.title, s.abstract, s.summary, s.keywords, s.version_no, s.status, s.is_locked, s.created_at, s.submitted_at, s.archived_at,
             cg.group_name,
             rp.program_code,
              t.task_id,
              t.task_name,
              at.academic_year,
              at.term_no,
             EXISTS (
               SELECT 1
               FROM submission_files sf
               WHERE sf.submission_id = s.submission_id
                 AND sf.file_type = 'Capstone Paper'
             ) AS has_capstone_paper,
             EXISTS (
               SELECT 1
               FROM submission_files sf
               WHERE sf.submission_id = s.submission_id
                 AND sf.file_type = 'Dataset'
             ) AS has_dataset,
             adv.fname AS adviser_fname,
             adv.lname AS adviser_lname
      FROM submissions s
      LEFT JOIN capstone_groups cg ON cg.group_id = s.group_id
      LEFT JOIN ref_degree_programs rp ON rp.program_id = cg.program_id
            LEFT JOIN tasks t ON t.task_id = s.task_id
            LEFT JOIN academic_terms at ON at.term_id = t.term_id
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
      `(s.title ILIKE $${params.length} OR s.abstract ILIKE $${params.length} OR COALESCE(s.summary, '') ILIKE $${params.length} OR s.keywords::text ILIKE $${params.length})`,
    );
  }

  const where = whereClauses.length
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";

  const sql = `
    SELECT s.submission_id, s.group_id, s.title, s.abstract, s.summary, s.keywords, s.version_no, s.status, s.is_locked, s.created_at, s.submitted_at,
           cg.group_name, cg.program_id,
           rp.program_code,
           t.task_id,
           t.task_name,
           at.academic_year,
           at.term_no,
           EXISTS (
             SELECT 1
             FROM submission_files sf
             WHERE sf.submission_id = s.submission_id
               AND sf.file_type = 'Capstone Paper'
           ) AS has_capstone_paper,
           EXISTS (
             SELECT 1
             FROM submission_files sf
             WHERE sf.submission_id = s.submission_id
               AND sf.file_type = 'Dataset'
           ) AS has_dataset,
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
    LEFT JOIN tasks t ON t.task_id = s.task_id
    LEFT JOIN academic_terms at ON at.term_id = t.term_id
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
    summary = null,
    keywords,
    versionNo,
    status = "Draft",
    isLocked = false,
  },
) => {
  const result = await db.query(
    `
      INSERT INTO submissions (task_id, group_id, title, abstract, summary, keywords, version_no, status, is_locked, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING submission_id, group_id, title, abstract, summary, keywords, version_no, status, is_locked, created_at
    `,
    [
      taskId,
      groupId,
      title,
      abstract,
      summary,
      keywords,
      versionNo,
      status,
      isLocked,
    ],
  );

  return result.rows[0];
};

let hasTaskAutoLockAfterDueDateColumnCache = null;

const hasTaskAutoLockAfterDueDateColumn = async (db) => {
  if (typeof hasTaskAutoLockAfterDueDateColumnCache === "boolean") {
    return hasTaskAutoLockAfterDueDateColumnCache;
  }

  const result = await db.query(
    `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tasks'
        AND column_name = 'auto_lock_after_due_date'
      LIMIT 1
    `,
  );

  hasTaskAutoLockAfterDueDateColumnCache = result.rowCount > 0;
  return hasTaskAutoLockAfterDueDateColumnCache;
};

export const findCurrentTask = async (db) => {
  const hasAutoLockAfterDueDate = await hasTaskAutoLockAfterDueDateColumn(db);
  const autoLockExpr = hasAutoLockAfterDueDate
    ? "t.auto_lock_after_due_date AS auto_lock_after_due_date"
    : "false::boolean AS auto_lock_after_due_date";

  const result = await db.query(
    `
      SELECT t.task_id, t.task_name, t.description, t.due_date, t.term_id, t.is_locked,
             ${autoLockExpr},
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
    `SELECT t.task_id, t.task_name, t.description, t.due_date, t.term_id, t.is_locked,
        ${autoLockExpr},
            at.academic_year, at.term_no, at.start_date, at.end_date
     FROM tasks t
     JOIN academic_terms at ON at.term_id = t.term_id
     ORDER BY t.created_at DESC LIMIT 1`,
  );
  return fallback.rows[0] || null;
};

export const findTaskById = async (db, taskId) => {
  const hasAutoLockAfterDueDate = await hasTaskAutoLockAfterDueDateColumn(db);
  const autoLockExpr = hasAutoLockAfterDueDate
    ? "t.auto_lock_after_due_date AS auto_lock_after_due_date"
    : "false::boolean AS auto_lock_after_due_date";

  const result = await db.query(
    `
      SELECT t.task_id, t.task_name, t.description, t.due_date, t.term_id, t.is_locked,
             ${autoLockExpr},
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

export const findAcademicTermByYearAndTermNo = async (db, academicYear, termNo) => {
  const result = await db.query(
    `
      SELECT term_id, academic_year, term_no
      FROM academic_terms
      WHERE academic_year = $1
        AND term_no = $2
      LIMIT 1
    `,
    [academicYear, termNo],
  );
  return result.rows[0] || null;
};

export const createCoordinatorTask = async (
  db,
  { taskName, description, dueDate, termId, autoLockAfterDueDate = false },
) => {
  const result = await db.query(
    `
      INSERT INTO tasks (task_name, description, due_date, term_id, auto_lock_after_due_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING task_id, task_name, description, due_date, term_id, is_locked, auto_lock_after_due_date, created_at
    `,
    [taskName, description || null, dueDate || null, termId, autoLockAfterDueDate],
  );

  return result.rows[0] || null;
};

export const updateCoordinatorTask = async (
  db,
  taskId,
  { taskName, description, dueDate, termId, autoLockAfterDueDate = false },
) => {
  const result = await db.query(
    `
      UPDATE tasks
      SET task_name = $1,
          description = $2,
          due_date = $3,
          term_id = $4,
          auto_lock_after_due_date = $5
      WHERE task_id = $6
      RETURNING task_id, task_name, description, due_date, term_id, is_locked, auto_lock_after_due_date, created_at
    `,
    [taskName, description || null, dueDate || null, termId, autoLockAfterDueDate, taskId],
  );

  return result.rows[0] || null;
};

export const deleteCoordinatorTask = async (db, taskId) => {
  const result = await db.query(
    `
      DELETE FROM tasks
      WHERE task_id = $1
      RETURNING task_id
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
          END,
          archived_at = CASE
            WHEN $1::submission_status = 'Archived'::submission_status
            THEN CURRENT_TIMESTAMP
            ELSE NULL
          END
      WHERE submission_id = $2
      RETURNING submission_id, status, submitted_at, archived_at
    `,
    [status, submissionId],
  );

  return result.rows[0] || null;
};

export const updateSubmission = async (
  db,
  { submissionId, title, abstract, summary, keywords, versionNo, isLocked },
) => {
  const result = await db.query(
    `
      UPDATE submissions
      SET title = $1, abstract = $2, summary = $3, keywords = $4, version_no = $5, is_locked = $6
      WHERE submission_id = $7
      RETURNING submission_id, group_id, title, abstract, summary, keywords, version_no, status, is_locked, created_at, submitted_at
    `,
    [title, abstract, summary, keywords, versionNo, isLocked, submissionId],
  );

  return result.rows[0] || null;
};

export const updateSubmissionSummary = async (
  db,
  { submissionId, summary },
) => {
  const result = await db.query(
    `
      UPDATE submissions
      SET summary = $1
      WHERE submission_id = $2
      RETURNING submission_id, task_id, group_id, title, abstract, summary, keywords, version_no, status, is_locked, created_at, submitted_at, archived_at
    `,
    [summary, submissionId],
  );

  return result.rows[0] || null;
};

export const listSubmissionsByGroupId = async (db, groupId) => {
  const result = await db.query(
    `
      SELECT submission_id, task_id, group_id, title, abstract, summary, keywords, version_no, status, is_locked, created_at, submitted_at, archived_at
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
      SELECT submission_id, task_id, group_id, title, abstract, summary, keywords, version_no, status, is_locked, created_at, submitted_at, archived_at
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
      SELECT submission_id, task_id, group_id, title, abstract, summary, keywords, version_no, status, is_locked, created_at, submitted_at, archived_at
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
  const hasAutoLockAfterDueDate = await hasTaskAutoLockAfterDueDateColumn(db);
  const autoLockExpr = hasAutoLockAfterDueDate
    ? "t.auto_lock_after_due_date AS auto_lock_after_due_date"
    : "false::boolean AS auto_lock_after_due_date";

  const result = await db.query(
    `
      SELECT
        t.task_id,
        t.task_name,
        t.description,
        t.due_date,
        t.is_locked,
        ${autoLockExpr},
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

export const listAllTasksWithSubmissionStats = async (db) => {
  const hasAutoLockAfterDueDate = await hasTaskAutoLockAfterDueDateColumn(db);
  const autoLockExpr = hasAutoLockAfterDueDate
    ? "t.auto_lock_after_due_date AS auto_lock_after_due_date"
    : "false::boolean AS auto_lock_after_due_date";
  const autoLockGroupBy = hasAutoLockAfterDueDate
    ? "t.auto_lock_after_due_date,"
    : "";

  const result = await db.query(
    `
      SELECT
        t.task_id,
        t.task_name,
        t.description,
        t.due_date,
        t.is_locked,
        ${autoLockExpr},
        t.created_at,
        at.term_id,
        at.academic_year,
        at.term_no,
        COALESCE(COUNT(s.submission_id), 0)::int AS submission_count,
        MAX(s.submitted_at) AS latest_submission_at,
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT rp.program_code), NULL) AS program_codes
      FROM tasks t
      JOIN academic_terms at ON at.term_id = t.term_id
      LEFT JOIN submissions s ON s.task_id = t.task_id
      LEFT JOIN capstone_groups cg ON cg.group_id = s.group_id
      LEFT JOIN ref_degree_programs rp ON rp.program_id = cg.program_id
      GROUP BY
        t.task_id,
        t.task_name,
        t.description,
        t.due_date,
        t.is_locked,
        ${autoLockGroupBy}
        t.created_at,
        at.term_id,
        at.academic_year,
        at.term_no
      ORDER BY at.start_date DESC, t.due_date ASC NULLS LAST, t.created_at DESC
    `,
  );

  return result.rows;
};

export const toggleTaskLockStatus = async (db, taskId) => {
  const result = await db.query(
    `
      UPDATE tasks
      SET is_locked = NOT COALESCE(is_locked, false)
      WHERE task_id = $1
      RETURNING task_id, is_locked
    `,
    [taskId],
  );

  return result.rows[0] || null;
};

export const toggleTaskAutoLockAfterDueDate = async (db, taskId) => {
  const hasAutoLockAfterDueDate = await hasTaskAutoLockAfterDueDateColumn(db);
  if (!hasAutoLockAfterDueDate) {
    const error = new Error(
      "Auto-lock is not available until the database migration is applied.",
    );
    error.statusCode = 400;
    throw error;
  }

  const result = await db.query(
    `
      UPDATE tasks
      SET auto_lock_after_due_date = NOT COALESCE(auto_lock_after_due_date, false)
      WHERE task_id = $1
      RETURNING task_id, auto_lock_after_due_date
    `,
    [taskId],
  );

  return result.rows[0] || null;
};

export const listAcademicTerms = async (db) => {
  const result = await db.query(
    `
      SELECT term_id, academic_year, term_no, start_date, end_date
      FROM academic_terms
      ORDER BY start_date DESC, term_no DESC
    `,
  );

  return result.rows;
};
