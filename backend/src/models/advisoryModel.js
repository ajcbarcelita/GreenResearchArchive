export const listAdvisoryLoadRows = async (
  db,
  { q, programCode, status, adviserId } = {},
) => {
  const params = [];
  const whereClauses = ["rr.role_name IN ('Faculty', 'Coordinator')"];

  if (adviserId) {
    params.push(adviserId);
    whereClauses.push(`adv.user_id = $${params.length}`);
  }

  if (programCode) {
    params.push(programCode);
    whereClauses.push(`rp.program_code = $${params.length}`);
  }

  if (status) {
    if (status === "No Submission") {
      whereClauses.push("ls.status IS NULL");
    } else {
      params.push(status);
      whereClauses.push(`ls.status::text = $${params.length}`);
    }
  }

  if (q) {
    params.push(`%${q}%`);
    whereClauses.push(
      `(
        CONCAT_WS(' ', adv.fname, adv.mname, adv.lname) ILIKE $${params.length}
        OR adv.email ILIKE $${params.length}
        OR cg.group_name ILIKE $${params.length}
        OR rp.program_code ILIKE $${params.length}
        OR rp.program_name ILIKE $${params.length}
        OR COALESCE(ls.status::text, 'No Submission') ILIKE $${params.length}
      )`,
    );
  }

  const where = whereClauses.length
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";

  const result = await db.query(
    `
      WITH latest_submission AS (
        SELECT DISTINCT ON (s.group_id)
          s.group_id,
          s.status,
          s.submitted_at,
          s.version_no,
          s.is_locked,
          s.created_at
        FROM submissions s
        ORDER BY s.group_id, COALESCE(s.submitted_at, s.created_at) DESC, s.submission_id DESC
      ),
      member_stats AS (
        SELECT gm.group_id, COUNT(*)::int AS member_count
        FROM group_members gm
        GROUP BY gm.group_id
      )
      SELECT
        adv.user_id AS adviser_id,
        adv.fname AS adviser_fname,
        adv.mname AS adviser_mname,
        adv.lname AS adviser_lname,
        adv.email AS adviser_email,
        adv.is_active AS adviser_is_active,
        rr.role_name AS adviser_role,
        cg.group_id,
        cg.group_name,
        cg.is_active AS group_is_active,
        cg.created_at AS group_created_at,
        rp.program_id,
        rp.program_code,
        rp.program_name,
        COALESCE(ms.member_count, 0) AS member_count,
        ls.status AS latest_submission_status,
        ls.submitted_at AS latest_submitted_at,
        ls.version_no AS latest_version_no,
        ls.is_locked AS latest_is_locked
      FROM capstone_groups cg
      JOIN users adv ON adv.user_id = cg.group_adviser
      JOIN ref_roles rr ON rr.role_id = adv.role_id
      JOIN ref_degree_programs rp ON rp.program_id = cg.program_id
      LEFT JOIN member_stats ms ON ms.group_id = cg.group_id
      LEFT JOIN latest_submission ls ON ls.group_id = cg.group_id
      ${where}
      ORDER BY adv.lname ASC, adv.fname ASC, cg.group_name ASC
    `,
    params,
  );

  return result.rows;
};
