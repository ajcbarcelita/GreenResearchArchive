import {
  listSubmissions,
  findSubmissionById,
  updateSubmissionStatus,
} from "../models/submissionModel.js";
import {
  listSubmissionFilesBySubmissionId,
  findSubmissionFileById,
} from "../models/submissionFileModel.js";
import { readObject } from "../services/s3CrudService.js";

const mapRowToResponse = (row) => {
  return {
    submissionId: row.submission_id,
    groupId: row.group_id,
    title: row.title,
    abstract: row.abstract,
    keywords: row.keywords || [],
    versionNo: row.version_no,
    status: row.status,
    groupName: row.group_name,
    programCode: row.program_code,
    taskId: row.task_id,
    taskName: row.task_name,
    academicYear: row.academic_year,
    termNo: row.term_no,
    adviserName:
      row.adviser_fname && row.adviser_lname
        ? `Prof. ${row.adviser_fname} ${row.adviser_lname}`
        : null,
    authors: row.authors ? row.authors.split(",").map((s) => s.trim()) : [],
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    isLocked: row.is_locked,
    hasCapstonePaper: row.has_capstone_paper === true,
    hasDataset: row.has_dataset === true,
  };
};

const mapSubmissionFile = (row) => ({
  fileId: row.file_id,
  submissionId: row.submission_id,
  fileName: row.file_name,
  fileType: row.file_type,
  fileSize: Number(row.file_size) || 0,
  uploadedAt: row.uploaded_at,
  versionNo: row.version_no,
});

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
    const files = await listSubmissionFilesBySubmissionId(db, row.submission_id);
    resp.files = files.map(mapSubmissionFile);

    return res.json({ data: resp });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const listRepositorySubmissionFiles = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const submissionId = Number(req.params.id);
    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      return res.status(400).json({ error: "Invalid submission ID" });
    }

    const submission = await findSubmissionById(db, submissionId);
    if (!submission) return res.status(404).json({ error: "Not found" });

    const files = await listSubmissionFilesBySubmissionId(db, submissionId);
    return res.json({ data: files.map(mapSubmissionFile) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const downloadRepositorySubmissionFile = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const fileId = Number(req.params.fileId);
    if (!Number.isInteger(fileId) || fileId <= 0) {
      return res.status(400).json({ error: "Invalid file ID" });
    }

    const file = await findSubmissionFileById(db, fileId);
    if (!file) return res.status(404).json({ error: "File not found" });

    const object = await readObject({ key: file.s3_key, as: "stream" });
    const contentType = object.contentType || "application/octet-stream";
    const safeName = String(file.file_name || `submission-file-${fileId}`).replace(/[\r\n"]/g, "_");

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
    if (object.contentLength) {
      res.setHeader("Content-Length", String(object.contentLength));
    }

    object.body.on("error", () => {
      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.end();
      }
    });

    object.body.pipe(res);
  } catch (err) {
    const statusCode = err?.statusCode || 500;
    return res.status(statusCode).json({ error: err.message || "Failed to download file" });
  }
};

export const toggleRepositoryArchiveStatus = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const { id } = req.params;
    const row = await findSubmissionById(db, id);
    if (!row) return res.status(404).json({ error: "Not found" });

    const nextStatus = row.status === "Archived" ? "Submitted" : "Archived";
    await updateSubmissionStatus(db, {
      submissionId: row.submission_id,
      status: nextStatus,
    });

    const updated = await findSubmissionById(db, id);
    if (!updated) return res.status(404).json({ error: "Not found" });

    return res.json({ data: mapRowToResponse(updated) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const addRepositoryComment = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const submissionId = Number(req.params.id);
    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      return res.status(400).json({ error: "Invalid submission ID" });
    }

    const roleName = String(req.auth?.roleName || "").trim().toLowerCase();
    if (roleName !== "faculty" && roleName !== "coordinator") {
      return res.status(403).json({ error: "Only faculty and coordinator can submit comments" });
    }

    const actorId = Number(req.auth?.sub);
    if (!Number.isInteger(actorId) || actorId <= 0) {
      return res.status(401).json({ error: "Invalid authenticated user context" });
    }

    const submission = await findSubmissionById(db, submissionId);
    if (!submission) return res.status(404).json({ error: "Not found" });

    const remarks = String(req.body?.remarks || "").trim();
    if (!remarks) {
      return res.status(400).json({ error: "Comment is required" });
    }
    if (remarks.length > 1000) {
      return res.status(400).json({ error: "Comment must be at most 1000 characters" });
    }

    const inserted = await db.query(
      `
        INSERT INTO submission_audit_logs (submission_id, changed_by, old_status, new_status, remarks)
        VALUES ($1, $2, NULL, NULL, $3)
        RETURNING log_id, submission_id, changed_by, remarks, changed_at
      `,
      [submissionId, actorId, remarks],
    );

    const row = inserted.rows[0];
    return res.status(201).json({
      data: {
        logId: row.log_id,
        submissionId: row.submission_id,
        actorId: row.changed_by,
        remarks: row.remarks,
        changedAt: row.changed_at,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const listRepositoryComments = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const submissionId = Number(req.params.id);
    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      return res.status(400).json({ error: "Invalid submission ID" });
    }

    const roleName = String(req.auth?.roleName || "").trim().toLowerCase();
    if (roleName !== "faculty" && roleName !== "coordinator") {
      return res.status(403).json({ error: "Only faculty and coordinator can view comments" });
    }

    const submission = await findSubmissionById(db, submissionId);
    if (!submission) return res.status(404).json({ error: "Not found" });

    const result = await db.query(
      `
        SELECT
          sal.log_id,
          sal.submission_id,
          sal.changed_by,
          sal.remarks,
          sal.changed_at,
          u.fname,
          u.mname,
          u.lname,
          rr.role_name
        FROM submission_audit_logs sal
        LEFT JOIN users u ON u.user_id = sal.changed_by
        LEFT JOIN ref_roles rr ON rr.role_id = u.role_id
        WHERE sal.submission_id = $1
          AND sal.remarks IS NOT NULL
          AND BTRIM(sal.remarks) <> ''
        ORDER BY sal.changed_at DESC, sal.log_id DESC
      `,
      [submissionId],
    );

    const data = result.rows.map((row) => ({
      logId: row.log_id,
      submissionId: row.submission_id,
      actorId: row.changed_by,
      actorName: [row.fname, row.mname, row.lname].filter(Boolean).join(" ") || "Unknown User",
      actorRole: row.role_name || null,
      remarks: row.remarks,
      changedAt: row.changed_at,
    }));

    return res.json({ data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
