import {
  listSubmissions,
  findSubmissionById,
} from "../models/submissionModel.js";

const mapRowToResponse = (row) => {
  return {
    submissionId: row.submission_id,
    title: row.title,
    abstract: row.abstract,
    keywords: row.keywords || [],
    versionNo: row.version_no,
    groupName: row.group_name,
    programCode: row.program_code,
    adviserName:
      row.adviser_fname && row.adviser_lname
        ? `Prof. ${row.adviser_fname} ${row.adviser_lname}`
        : null,
    authors: row.authors ? row.authors.split(",").map((s) => s.trim()) : [],
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    isLocked: row.is_locked,
  };
};

export const listRepository = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const { program, q, status } = req.query;

    const params = {};
    if (program) params.programId = program;
    if (q) params.q = q;
    if (status) params.status = status;

    const rows = await listSubmissions(db, params);
    const data = rows.map(mapRowToResponse);
    return res.json({ data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getRepositoryById = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const { id } = req.params;
    const row = await findSubmissionById(db, id);
    if (!row) return res.status(404).json({ error: "Not found" });

    // fetch group members (authors)
    const membersRes = await db.query(
      `SELECT u.fname, u.mname, u.lname FROM group_members gm JOIN users u ON u.user_id = gm.student_id WHERE gm.group_id = $1 ORDER BY u.lname, u.fname`,
      [row.group_id],
    );

    const authors = (membersRes.rows || []).map(
      (m) => `${m.fname} ${m.mname ? m.mname + " " : ""}${m.lname}`,
    );

    const resp = mapRowToResponse(row);
    resp.authors = authors;

    return res.json({ data: resp });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
