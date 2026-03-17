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
      SELECT t.task_id, t.task_name, t.description, t.due_date, t.term_id
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
    `SELECT task_id, task_name, description, due_date, term_id
     FROM tasks ORDER BY created_at DESC LIMIT 1`,
  );
  return fallback.rows[0] || null;
};

export const updateSubmissionStatus = async (db, { submissionId, status }) => {
  const result = await db.query(
    `
      UPDATE submissions
      SET status = $1, submitted_at = CASE WHEN $1 = 'Submitted' THEN CURRENT_TIMESTAMP ELSE submitted_at END
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
      LEFT JOIN submissions s ON s.task_id = t.task_id AND s.group_id = $1
      ORDER BY at2.start_date DESC, t.due_date ASC
    `,
    [groupId],
  );
  return result.rows;
};
