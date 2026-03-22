import { listAdvisoryLoadRows } from "../models/advisoryModel.js";
import {
  listGroupMembers,
  addGroupMember as addGroupMemberModel,
  removeGroupMember as removeGroupMemberModel,
  existsGroupMember,
} from "../models/groupMembersModel.js";

import {
  findCapstoneGroupById,
  insertCapstoneGroup,
  deleteCapstoneGroup,
} from "../models/capstoneGroupModel.js";
import {
  listAllTasksWithSubmissionStats,
  toggleTaskLockStatus,
  toggleTaskAutoLockAfterDueDate,
  listAcademicTerms,
  findAcademicTermByYearAndTermNo,
  createCoordinatorTask as createCoordinatorTaskModel,
  updateCoordinatorTask as updateCoordinatorTaskModel,
  deleteCoordinatorTask as deleteCoordinatorTaskModel,
} from "../models/submissionModel.js";
import { findUserProfileById } from "../models/userModel.js";

const toInt = (value) => Number.parseInt(String(value), 10);

const mapAdvisoryRow = (row) => ({
  adviserId: row.adviser_id,
  adviserName: [row.adviser_fname, row.adviser_mname, row.adviser_lname]
    .filter(Boolean)
    .join(" "),
  adviserEmail: row.adviser_email,
  adviserRole: row.adviser_role,
  adviserIsActive: row.adviser_is_active,
  groupId: row.group_id,
  groupName: row.group_name,
  groupIsActive: row.group_is_active,
  groupCreatedAt: row.group_created_at,
  programId: row.program_id,
  programCode: row.program_code,
  programName: row.program_name,
  memberCount: toInt(row.member_count) || 0,
  latestSubmissionTitle: row.latest_submission_title || null,
  latestSubmissionStatus: row.latest_submission_status || null,
  latestSubmittedAt: row.latest_submitted_at || null,
  latestVersionNo: row.latest_version_no ? toInt(row.latest_version_no) : null,
  latestIsLocked: row.latest_is_locked === true,
});

const buildSummary = (rows) => {
  const adviserIds = new Set(rows.map((row) => row.adviserId));
  const statusesNeedingAttention = new Set([
    "Revision Requested",
    "Under Review",
  ]);

  return {
    totalAdvisers: adviserIds.size,
    totalGroups: rows.length,
    activeGroups: rows.filter((row) => row.groupIsActive).length,
    groupsWithoutSubmission: rows.filter((row) => !row.latestSubmissionStatus)
      .length,
    groupsNeedingAttention: rows.filter((row) =>
      statusesNeedingAttention.has(row.latestSubmissionStatus),
    ).length,
  };
};

export const getAdvisoryLoad = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) {
      return res.status(500).json({ error: "Database not initialized" });
    }

    const q = String(req.query?.q || "").trim();
    const programCode = String(req.query?.programCode || "").trim();
    const status = String(req.query?.status || "").trim();
    const adviserIdRaw = String(req.query?.adviserId || "").trim();
    const adviserId = adviserIdRaw ? toInt(adviserIdRaw) : null;

    const rows = await listAdvisoryLoadRows(db, {
      q: q || null,
      programCode: programCode || null,
      status: status || null,
      adviserId: Number.isInteger(adviserId) ? adviserId : null,
    });

    const filterRows = await listAdvisoryLoadRows(db);
    const data = rows.map(mapAdvisoryRow);
    const filterData = filterRows.map(mapAdvisoryRow);
    const summary = buildSummary(data);

    const filters = {
      programs: Array.from(
        new Set(filterData.map((row) => row.programCode).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
      statuses: Array.from(
        new Set(
          filterData.map(
            (row) => row.latestSubmissionStatus || "No Submission",
          ),
        ),
      ).sort((a, b) => a.localeCompare(b)),
      advisers: Array.from(
        new Map(
          filterData.map((row) => [
            row.adviserId,
            { adviserId: row.adviserId, adviserName: row.adviserName },
          ]),
        ).values(),
      ).sort((a, b) => a.adviserName.localeCompare(b.adviserName)),
    };

    return res.json({
      data,
      summary,
      filters,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getMyGroups = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const userId = Number(req.auth?.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ error: "Invalid authenticated user" });
    }

    const rows = await listAdvisoryLoadRows(db, { adviserId: userId });
    const data = rows.map(mapAdvisoryRow);

    return res.json({ data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getGroupMembers = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const { groupId } = req.params;
    const rows = await listGroupMembers(db, Number(groupId));
    return res.json({ data: rows });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const addGroupMember = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const userId = Number(req.auth?.sub);
    const { groupId } = req.params;
    const { studentId, email, universityId } = req.body || {};

    const group = await findCapstoneGroupById(db, Number(groupId));
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (Number(group.group_adviser) !== Number(userId)) {
      return res
        .status(403)
        .json({ error: "Not authorized to modify this group" });
    }

    let student = null;
    if (studentId) {
      student = await findUserProfileById(db, Number(studentId));
    }

    if (!student && (email || universityId)) {
      const lookupEmail = email ? String(email).toLowerCase() : null;
      const lookupUni = universityId ? String(universityId) : null;
      const result = await db.query(
        `SELECT user_id, email, university_id FROM users WHERE email = $1 OR university_id = $2 LIMIT 1`,
        [lookupEmail, lookupUni],
      );
      student = result.rows[0] || null;
    }

    if (!student) return res.status(404).json({ error: "Student not found" });

    const targetStudentId = Number(student.user_id || student.user_id);

    const already = await existsGroupMember(db, {
      groupId: Number(groupId),
      studentId: targetStudentId,
    });
    if (already)
      return res
        .status(409)
        .json({ error: "Student is already a member of the group" });

    const inserted = await addGroupMemberModel(db, {
      groupId: Number(groupId),
      studentId: targetStudentId,
    });
    return res.status(201).json({ data: inserted });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const removeGroupMember = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const userId = Number(req.auth?.sub);
    const { groupId, studentId } = req.params;

    const group = await findCapstoneGroupById(db, Number(groupId));
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (Number(group.group_adviser) !== Number(userId)) {
      return res
        .status(403)
        .json({ error: "Not authorized to modify this group" });
    }

    const removed = await removeGroupMemberModel(db, {
      groupId: Number(groupId),
      studentId: Number(studentId),
    });
    if (!removed)
      return res.status(404).json({ error: "Member not found in group" });

    return res.json({ data: removed });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const searchStudents = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const qRaw = String(req.query?.q || "").trim();
    if (!qRaw) return res.json({ data: [] });

    // find student role id
    const roleRes = await db.query(
      `SELECT role_id FROM ref_roles WHERE LOWER(role_name) = LOWER($1) LIMIT 1`,
      ["Student"],
    );
    const studentRole = roleRes.rows[0];
    const studentRoleId = studentRole ? studentRole.role_id : null;

    const q = `%${qRaw}%`;
    const params = [q, q, q, 20];
    let roleClause = "";
    if (studentRoleId) {
      roleClause = `AND u.role_id = ${studentRoleId}`;
    }

    const result = await db.query(
      `
        SELECT u.user_id, u.email, u.university_id, u.fname, u.mname, u.lname
        FROM users u
        WHERE (
          u.email ILIKE $1
          OR u.university_id ILIKE $2
          OR (u.fname || ' ' || COALESCE(u.mname || ' ', '') || u.lname) ILIKE $3
        )
        ${roleClause}
        ORDER BY u.lname ASC NULLS LAST, u.fname ASC
        LIMIT $4
      `,
      params,
    );

    return res.json({ data: result.rows });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const createGroup = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const userId = Number(req.auth?.sub);
    if (!Number.isInteger(userId) || userId <= 0)
      return res.status(401).json({ error: "Invalid authenticated user" });

    const { groupName, programId, studentIds } = req.body || {};
    if (!groupName || !String(groupName).trim())
      return res.status(400).json({ error: "groupName is required" });

    // create group with current user as adviser
    const created = await insertCapstoneGroup(db, {
      groupName: String(groupName).trim(),
      programId: programId ? Number(programId) : null,
      groupAdviser: userId,
    });

    // optionally add initial members
    const added = [];
    if (Array.isArray(studentIds) && studentIds.length) {
      for (const sidRaw of studentIds) {
        const sid = Number(sidRaw);
        if (!Number.isInteger(sid) || sid <= 0) continue;
        const exists = await existsGroupMember(db, {
          groupId: created.group_id || created.groupId || created.group_id,
          studentId: sid,
        });
        if (exists) continue;
        const inserted = await addGroupMemberModel(db, {
          groupId: created.group_id || created.groupId || created.group_id,
          studentId: sid,
        });
        if (inserted) added.push(inserted);
      }
    }

    // return created group (normalize keys)
    const groupResp = {
      groupId: created.group_id || created.groupId || created.group_id,
      groupName: created.group_name || created.groupName || created.group_name,
      programId: created.program_id || created.programId || null,
      groupAdviser: created.group_adviser || created.groupAdviser || userId,
      isActive: created.is_active || true,
      createdAt: created.created_at || new Date().toISOString(),
      members: added,
    };

    return res.status(201).json({ data: groupResp });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const userId = Number(req.auth?.sub);
    const { groupId } = req.params;

    const group = await findCapstoneGroupById(db, Number(groupId));
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (Number(group.group_adviser) !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this group" });
    }

    const deleted = await deleteCapstoneGroup(db, Number(groupId));
    if (!deleted) return res.status(404).json({ error: "Group not found" });

    return res.json({ data: deleted });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getCoordinatorTasks = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const roleName = String(req.auth?.roleName || "")
      .trim()
      .toLowerCase();
    if (roleName !== "coordinator" && roleName !== "faculty") {
      return res
        .status(403)
        .json({ error: "Only faculty and coordinator can view tasks" });
    }

    const rows = await listAllTasksWithSubmissionStats(db);
    const data = rows.map((row) => ({
      taskId: row.task_id,
      taskName: row.task_name,
      description: row.description,
      dueDate: row.due_date,
      isLocked: row.is_locked === true,
      autoLockAfterDueDate: row.auto_lock_after_due_date === true,
      createdAt: row.created_at,
      termId: row.term_id,
      academicYear: row.academic_year,
      termNo: row.term_no,
      submissionCount: Number(row.submission_count || 0),
      latestSubmissionAt: row.latest_submission_at,
      programCodes: Array.isArray(row.program_codes)
        ? row.program_codes.filter(Boolean)
        : [],
    }));

    return res.json({ data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getCoordinatorTerms = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const roleName = String(req.auth?.roleName || "")
      .trim()
      .toLowerCase();
    if (roleName !== "coordinator" && roleName !== "faculty") {
      return res
        .status(403)
        .json({ error: "Only faculty and coordinator can view terms" });
    }

    const rows = await listAcademicTerms(db);
    const data = rows.map((row) => ({
      termId: row.term_id,
      academicYear: row.academic_year,
      termNo: row.term_no,
      startDate: row.start_date,
      endDate: row.end_date,
    }));

    return res.json({ data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const toggleCoordinatorTaskLock = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const roleName = String(req.auth?.roleName || "")
      .trim()
      .toLowerCase();
    if (roleName !== "coordinator" && roleName !== "faculty") {
      return res
        .status(403)
        .json({ error: "Only faculty and coordinator can lock tasks" });
    }

    const taskId = Number(req.params.taskId);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    const updated = await toggleTaskLockStatus(db, taskId);
    if (!updated) {
      return res.status(404).json({ error: "Task not found" });
    }

    return res.json({
      data: {
        taskId: updated.task_id,
        isLocked: updated.is_locked === true,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const toggleCoordinatorTaskAutoLock = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const roleName = String(req.auth?.roleName || "")
      .trim()
      .toLowerCase();
    if (roleName !== "coordinator" && roleName !== "faculty") {
      return res.status(403).json({
        error: "Only faculty and coordinator can update task auto-lock",
      });
    }

    const taskId = Number(req.params.taskId);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    const updated = await toggleTaskAutoLockAfterDueDate(db, taskId);
    if (!updated) {
      return res.status(404).json({ error: "Task not found" });
    }

    return res.json({
      data: {
        taskId: updated.task_id,
        autoLockAfterDueDate: updated.auto_lock_after_due_date === true,
      },
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
};

const isValidAcademicYear = (value) => {
  const match = String(value || "")
    .trim()
    .match(/^(\d{4}-\d{4})$/);
  if (!match) return false;
  const parts = value.split("-");
  return Number(parts[1]) === Number(parts[0]) + 1;
};

const isValidTermNo = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num >= 1 && num <= 3;
};

const getTermId = async (db, body) => {
  if (body.termId && Number.isInteger(Number(body.termId))) {
    return Number(body.termId);
  }

  const academicYear = String(body.termYear || "").trim();
  const termNo = Number(body.termNo);

  if (!isValidAcademicYear(academicYear) || !isValidTermNo(termNo)) {
    throw { statusCode: 400, message: "Invalid term selection" };
  }

  const term = await findAcademicTermByYearAndTermNo(db, academicYear, termNo);
  if (!term) {
    throw { statusCode: 400, message: "Academic term not found" };
  }

  return term.term_id;
};

export const createCoordinatorTask = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const roleName = String(req.auth?.roleName || "")
      .trim()
      .toLowerCase();
    if (roleName !== "coordinator" && roleName !== "faculty") {
      return res
        .status(403)
        .json({ error: "Only faculty and coordinator can create tasks" });
    }

    const taskName = String(req.body.taskName || "").trim();
    if (!taskName) {
      return res.status(400).json({ error: "Task name is required" });
    }

    const termId = await getTermId(db, req.body);

    const description = String(req.body.description || "").trim() || null;
    const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    const autoLockAfterDueDate = Boolean(req.body.autoLockAfterDueDate);

    const created = await createCoordinatorTaskModel(db, {
      taskName,
      description,
      dueDate,
      termId,
      autoLockAfterDueDate,
    });

    return res.status(201).json({ data: created });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error.code === "23503") {
      return res.status(400).json({ error: "Term does not exist" });
    }
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const updateCoordinatorTask = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const roleName = String(req.auth?.roleName || "")
      .trim()
      .toLowerCase();
    if (roleName !== "coordinator" && roleName !== "faculty") {
      return res
        .status(403)
        .json({ error: "Only faculty and coordinator can update tasks" });
    }

    const taskId = Number(req.params.taskId);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    const taskName = String(req.body.taskName || "").trim();
    if (!taskName) {
      return res.status(400).json({ error: "Task name is required" });
    }

    const termId = await getTermId(db, req.body);

    const description = String(req.body.description || "").trim() || null;
    const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    const autoLockAfterDueDate = Boolean(req.body.autoLockAfterDueDate);

    const updated = await updateCoordinatorTaskModel(db, taskId, {
      taskName,
      description,
      dueDate,
      termId,
      autoLockAfterDueDate,
    });

    if (!updated) {
      return res.status(404).json({ error: "Task not found" });
    }

    return res.json({ data: updated });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error.code === "23503") {
      return res.status(400).json({ error: "Term does not exist" });
    }
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const deleteCoordinatorTask = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const roleName = String(req.auth?.roleName || "")
      .trim()
      .toLowerCase();
    if (roleName !== "coordinator" && roleName !== "faculty") {
      return res
        .status(403)
        .json({ error: "Only faculty and coordinator can delete tasks" });
    }

    const taskId = Number(req.params.taskId);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    const deleted = await deleteCoordinatorTaskModel(db, taskId);
    if (!deleted) {
      return res.status(404).json({ error: "Task not found" });
    }

    return res.status(204).send();
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error.code === "23503") {
      return res
        .status(400)
        .json({ error: "Cannot delete task with existing submissions" });
    }
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
};

export const getReviewQueue = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const userId = Number(req.auth?.sub);

    const result = await db.query(
      `
      SELECT
        s.submission_id,
        s.title,
        s.abstract,
        s.status,
        s.version_no,
        s.submitted_at,
        s.is_locked,
        cg.group_name,
        cg.group_id,
        rdp.program_code,
        t.task_name,
        (
          SELECT json_agg(json_build_object(
            'file_id', sf.file_id,
            'file_name', sf.file_name,
            'file_type', sf.file_type,
            'file_size', sf.file_size,
            's3_key', sf.s3_key
          ))
          FROM submission_files sf
          WHERE sf.submission_id = s.submission_id
        ) as files
      FROM submissions s
      JOIN capstone_groups cg ON s.group_id = cg.group_id
      JOIN ref_degree_programs rdp ON cg.program_id = rdp.program_id
      JOIN tasks t ON s.task_id = t.task_id
      WHERE cg.group_adviser = $1
        AND s.status IN ('Submitted', 'Under Review', 'Revision Requested')
      ORDER BY s.submitted_at DESC
      `,
      [userId],
    );

    return res.json({ data: result.rows });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateReviewStatus = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const userId = Number(req.auth?.sub);
    const { submissionId } = req.params;
    const { status, remarks } = req.body;

    // Verify ownership (adviser of the group)
    const checkRes = await db.query(
      `
      SELECT s.status, cg.group_adviser
      FROM submissions s
      JOIN capstone_groups cg ON s.group_id = cg.group_id
      WHERE s.submission_id = $1
      `,
      [submissionId],
    );

    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const submission = checkRes.rows[0];
    if (Number(submission.group_adviser) !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to review this submission" });
    }

    // Update status
    await db.query(
      `UPDATE submissions SET status = $1 WHERE submission_id = $2`,
      [status, submissionId],
    );

    // Add audit log
    await db.query(
      `
      INSERT INTO submission_audit_logs (submission_id, changed_by, old_status, new_status, remarks)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [submissionId, userId, submission.status, status, remarks || ""],
    );

    return res.json({ data: { success: true } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getGroupSubmissions = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const userId = Number(req.auth?.sub);
    const { groupId } = req.params;

    // Verify ownership (adviser of the group)
    const checkRes = await db.query(
      `SELECT group_adviser FROM capstone_groups WHERE group_id = $1`,
      [groupId],
    );

    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (Number(checkRes.rows[0].group_adviser) !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this group's submissions" });
    }

    const result = await db.query(
      `
      SELECT
        s.submission_id,
        s.title,
        s.abstract,
        s.status,
        s.version_no,
        s.submitted_at,
        s.is_locked,
        t.task_name,
        (
          SELECT json_agg(json_build_object(
            'file_id', sf.file_id,
            'file_name', sf.file_name,
            'file_type', sf.file_type,
            'file_size', sf.file_size,
            's3_key', sf.s3_key
          ))
          FROM submission_files sf
          WHERE sf.submission_id = s.submission_id
        ) as files,
        (
          SELECT json_agg(json_build_object(
            'log_id', sal.log_id,
            'old_status', sal.old_status,
            'new_status', sal.new_status,
            'remarks', sal.remarks,
            'changed_at', sal.changed_at
          ) ORDER BY sal.changed_at DESC)
          FROM submission_audit_logs sal
          WHERE sal.submission_id = s.submission_id
        ) as audit_logs
      FROM submissions s
      JOIN tasks t ON s.task_id = t.task_id
      WHERE s.group_id = $1
      ORDER BY s.submitted_at DESC
      `,
      [groupId],
    );

    return res.json({ data: result.rows });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteSubmission = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });

    const userId = Number(req.auth?.sub);
    const { submissionId } = req.params;

    // Verify ownership (adviser of the group)
    const checkRes = await db.query(
      `
      SELECT cg.group_adviser
      FROM submissions s
      JOIN capstone_groups cg ON s.group_id = cg.group_id
      WHERE s.submission_id = $1
      `,
      [submissionId],
    );

    if (checkRes.rowCount === 0) {
      return res.status(404).json({ error: "Submission not found" });
    }

    if (Number(checkRes.rows[0].group_adviser) !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this submission" });
    }

    // Delete submission - cascading will handle files, fields, and audit logs
    await db.query(`DELETE FROM submissions WHERE submission_id = $1`, [
      submissionId,
    ]);

    return res.json({ data: { success: true } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
