import Joi from "joi";
import { findGroupsForStudent } from "../models/groupMembersModel.js";
import {
  findSubmissionById,
  findLatestModifiedSubmissionByGroupId,
  findTaskById,
  findCurrentTask,
  findSubmissionByGroupAndTask,
  getNextSubmissionVersionForGroupTask,
  insertSubmission,
  listResearchFieldsBySubmissionId,
  listSubmissionsByGroupId,
  listTasksWithSubmissionStatus,
  replaceSubmissionResearchFields,
  updateSubmission,
  updateSubmissionStatus,
} from "../models/submissionModel.js";
import {
  deleteSubmissionFileById,
  findSubmissionFileById,
  getSubmissionFileStatsBySubmissionId,
  insertSubmissionFile,
  listSubmissionFilesBySubmissionId,
} from "../models/submissionFileModel.js";
import { findUserProfileById } from "../models/userModel.js";
import { createObject, deleteObject } from "../services/s3CrudService.js";

const saveSubmissionSchema = Joi.object({
  taskId: Joi.number().integer().positive().optional(),
  title: Joi.string().trim().max(300).required(),
  abstract: Joi.string().trim().required(),
  keywords: Joi.array().items(Joi.string().trim().max(100)).default([]),
  researchFields: Joi.array().items(Joi.string().trim().max(100)).default([]),
});

const uploadFileSchema = Joi.object({
  taskId: Joi.number().integer().positive().optional(),
  fileName: Joi.string().trim().max(255).required(),
  contentType: Joi.string().trim().max(100).required(),
  contentBase64: Joi.string().trim().required(),
  versionNo: Joi.number().integer().positive().optional(),
});

const parseOptionalTaskId = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error("Invalid task ID.");
    error.statusCode = 400;
    throw error;
  }

  return parsed;
};

const getCurrentSubmissionContext = async (db, userId, taskId = null) => {
  const groups = await findGroupsForStudent(db, userId);
  const activeGroup =
    (groups || []).find((group) => group.is_active) || groups[0] || null;

  if (!activeGroup) {
    const error = new Error("No capstone group found for this student.");
    error.statusCode = 404;
    throw error;
  }

  const submissions = await listSubmissionsByGroupId(db, activeGroup.group_id);

  let currentSubmission;
  if (taskId) {
    currentSubmission = await findSubmissionByGroupAndTask(
      db,
      activeGroup.group_id,
      taskId,
    );
  } else {
    currentSubmission = submissions[0] || null;
  }

  return {
    group: activeGroup,
    currentSubmission,
    history: submissions,
  };
};

export const getStudentTasks = async (req, res, next) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) {
      return res
        .status(500)
        .json({ message: "Database client is not initialized." });
    }

    const userId = Number(req.auth?.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res
        .status(401)
        .json({ message: "Invalid authenticated user context." });
    }

    const groups = await findGroupsForStudent(db, userId);
    const activeGroup =
      (groups || []).find((g) => g.is_active) || groups[0] || null;

    if (!activeGroup) {
      return res
        .status(404)
        .json({ message: "No capstone group found for this student." });
    }

    const rows = await listTasksWithSubmissionStatus(db, activeGroup.group_id);

    const tasks = rows.map((r) => ({
      taskId: r.task_id,
      taskName: r.task_name,
      description: r.description,
      dueDate: r.due_date,
      isLocked: r.is_locked === true,
         autoLockAfterDueDate: r.auto_lock_after_due_date === true,
      academicYear: r.academic_year,
      termNo: r.term_no,
      termStart: r.start_date,
      termEnd: r.end_date,
      isActiveTerm: r.is_active_term,
      submission: r.submission_id
        ? {
            submissionId: r.submission_id,
            status: r.submission_status,
            versionNo: r.submission_version_no,
            submittedAt: r.submitted_at,
          }
        : null,
    }));

    return res.status(200).json({
      group: {
        groupId: activeGroup.group_id,
        groupName: activeGroup.group_name,
      },
      tasks,
    });
  } catch (error) {
    return next(error);
  }
};

const inferFileType = (fileName = "", contentType = "") => {
  const lowerName = String(fileName).toLowerCase();
  const lowerType = String(contentType).toLowerCase();
  if (lowerName.endsWith(".pdf") || lowerType.includes("pdf")) {
    return "Capstone Paper";
  }

  return "Dataset";
};

const toS3Slug = (value = "") => {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "na";
};

const mapSubmission = (submission) => ({
  submissionId: submission.submission_id,
  taskId: submission.task_id,
  groupId: submission.group_id,
  title: submission.title,
  keywords: submission.keywords || [],
  researchFields: submission.research_fields || [],
  abstract: submission.abstract,
  versionNo: submission.version_no,
  status: submission.status,
  isLocked: submission.is_locked,
  createdAt: submission.created_at,
  submittedAt: submission.submitted_at,
});

const mapSubmissionFile = (file) => ({
  fileId: file.file_id,
  submissionId: file.submission_id,
  fileName: file.file_name,
  fileType: file.file_type,
  fileSize: file.file_size,
  uploadedAt: file.uploaded_at,
  versionNo: file.version_no,
});

const mapTask = (task) => {
  if (!task) return null;

  return {
    taskId: task.task_id,
    taskName: task.task_name,
    description: task.description,
    dueDate: task.due_date,
    isLocked: task.is_locked === true,
    autoLockAfterDueDate: task.auto_lock_after_due_date === true,
    academicYear: task.academic_year,
    termNo: task.term_no,
    termStart: task.start_date,
    termEnd: task.end_date,
  };
};

const ensureTaskAcceptingSubmissions = (task) => {
  const dueDateMs = task?.due_date ? Date.parse(task.due_date) : Number.NaN;
  const autoLockedByDueDate =
    task?.auto_lock_after_due_date === true && Number.isFinite(dueDateMs) && dueDateMs <= Date.now();

  if (task?.is_locked === true || autoLockedByDueDate) {
    const error = new Error("This task is locked and no longer accepts submissions.");
    error.statusCode = 423;
    throw error;
  }
};

const mapReviewer = (reviewer) => {
  if (!reviewer) return null;

  return {
    reviewerId: reviewer.user_id,
    reviewerName: [reviewer.fname, reviewer.mname, reviewer.lname]
      .filter(Boolean)
      .join(" "),
    reviewerEmail: reviewer.email,
    reviewerRole: reviewer.role_name,
  };
};

const mapFileStats = (stats) => ({
  capstonePaperCount: Number(stats?.capstone_paper_count || 0),
  datasetCount: Number(stats?.dataset_count || 0),
  latestUploadAt: stats?.latest_upload_at || null,
});

export const getLatestStudentSubmission = async (req, res, next) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) {
      return res
        .status(500)
        .json({ message: "Database client is not initialized." });
    }

    const userId = Number(req.auth?.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res
        .status(401)
        .json({ message: "Invalid authenticated user context." });
    }

    const { group } = await getCurrentSubmissionContext(db, userId, null);
    const latestSubmission = await findLatestModifiedSubmissionByGroupId(
      db,
      group.group_id,
    );
    const reviewer = group?.group_adviser
      ? await findUserProfileById(db, Number(group.group_adviser))
      : null;

    if (!latestSubmission) {
      return res.status(200).json({
        message: "No submission found yet.",
        group: {
          groupId: group.group_id,
          groupName: group.group_name,
        },
        reviewer: mapReviewer(reviewer),
        task: null,
        submission: null,
        fileStats: mapFileStats(null),
      });
    }

    const task = await findTaskById(db, latestSubmission.task_id);
    const fileStats = await getSubmissionFileStatsBySubmissionId(
      db,
      latestSubmission.submission_id,
    );

    return res.status(200).json({
      message: "Latest submission fetched.",
      group: {
        groupId: group.group_id,
        groupName: group.group_name,
      },
      reviewer: mapReviewer(reviewer),
      task: mapTask(task),
      submission: mapSubmission(latestSubmission),
      fileStats: mapFileStats(fileStats),
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
};

export const getCurrentStudentSubmission = async (req, res, next) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) {
      return res
        .status(500)
        .json({ message: "Database client is not initialized." });
    }

    const userId = Number(req.auth?.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res
        .status(401)
        .json({ message: "Invalid authenticated user context." });
    }

    const taskId = parseOptionalTaskId(req.query.taskId);
    const { group, currentSubmission, history } =
      await getCurrentSubmissionContext(db, userId, taskId);
    const task = taskId
      ? await findTaskById(db, taskId)
      : currentSubmission?.task_id
        ? await findTaskById(db, currentSubmission.task_id)
        : await findCurrentTask(db);
    const reviewer = group?.group_adviser
      ? await findUserProfileById(db, Number(group.group_adviser))
      : null;

    if (!currentSubmission) {
      return res.status(200).json({
        message: "No submission found yet.",
        group: {
          groupId: group.group_id,
          groupName: group.group_name,
        },
        reviewer: mapReviewer(reviewer),
        task: mapTask(task),
        submission: null,
        files: [],
        history: [],
      });
    }

    const files = await listSubmissionFilesBySubmissionId(
      db,
      currentSubmission.submission_id,
    );
    const researchFields = await listResearchFieldsBySubmissionId(
      db,
      currentSubmission.submission_id,
    );
    const currentSubmissionWithResearchFields = {
      ...currentSubmission,
      research_fields: researchFields,
    };

    return res.status(200).json({
      message: "Current submission fetched.",
      group: {
        groupId: group.group_id,
        groupName: group.group_name,
      },
      reviewer: mapReviewer(reviewer),
      task: mapTask(task),
      submission: mapSubmission(currentSubmissionWithResearchFields),
      files: files.map(mapSubmissionFile),
      history: history.map(mapSubmission),
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
};

export const saveCurrentStudentSubmission = async (req, res, next) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) {
      return res
        .status(500)
        .json({ message: "Database client is not initialized." });
    }

    const userId = Number(req.auth?.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res
        .status(401)
        .json({ message: "Invalid authenticated user context." });
    }

    const { error, value } = saveSubmissionSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: "Invalid request body",
        details: error.details.map((item) => item.message),
      });
    }

    const resolvedTaskId = value.taskId ? Number(value.taskId) : null;
    const { group, currentSubmission } = await getCurrentSubmissionContext(
      db,
      userId,
      resolvedTaskId,
    );

    const effectiveTaskId =
      resolvedTaskId ||
      currentSubmission?.task_id ||
      (await findCurrentTask(db))?.task_id;
    if (!effectiveTaskId) {
      return res.status(500).json({
        message:
          "No active task found. Ask your coordinator to set up the current term tasks.",
      });
    }

    const effectiveTask = await findTaskById(db, effectiveTaskId);
    ensureTaskAcceptingSubmissions(effectiveTask);

    let submission;
    const shouldCreateNewVersion =
      !currentSubmission || currentSubmission.status !== "Draft";

    if (shouldCreateNewVersion) {
      const currentTask = { task_id: effectiveTaskId };
      if (!currentTask) {
        return res.status(500).json({
          message:
            "No active task found. Ask your coordinator to set up the current term tasks.",
        });
      }

      const assignedVersionNo = await getNextSubmissionVersionForGroupTask(db, {
        groupId: group.group_id,
        taskId: effectiveTaskId,
      });

      submission = await insertSubmission(db, {
        taskId: currentTask.task_id,
        groupId: group.group_id,
        title: value.title,
        abstract: value.abstract,
        keywords: value.keywords || [],
        versionNo: assignedVersionNo,
        status: "Draft",
        isLocked: false,
      });
    } else {
      submission = await updateSubmission(db, {
        submissionId: currentSubmission.submission_id,
        title: value.title,
        abstract: value.abstract,
        keywords: value.keywords || [],
        versionNo: currentSubmission.version_no,
        isLocked: false,
      });
    }

    await replaceSubmissionResearchFields(db, {
      submissionId: submission.submission_id,
      researchFields: value.researchFields || [],
    });
    const researchFields = await listResearchFieldsBySubmissionId(
      db,
      submission.submission_id,
    );
    const submissionWithResearchFields = {
      ...submission,
      research_fields: researchFields,
    };

    return res.status(200).json({
      message: "Submission draft saved.",
      submission: mapSubmission(submissionWithResearchFields),
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
};

export const submitCurrentStudentSubmission = async (req, res, next) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) {
      return res
        .status(500)
        .json({ message: "Database client is not initialized." });
    }

    const userId = Number(req.auth?.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res
        .status(401)
        .json({ message: "Invalid authenticated user context." });
    }

    const taskId = parseOptionalTaskId(req.query.taskId);
    const { currentSubmission } = await getCurrentSubmissionContext(
      db,
      userId,
      taskId,
    );
    if (!currentSubmission) {
      return res.status(400).json({
        message: "No draft submission found. Save a draft first.",
      });
    }

    const task = await findTaskById(db, currentSubmission.task_id);
    ensureTaskAcceptingSubmissions(task);

    const fileStats = await getSubmissionFileStatsBySubmissionId(
      db,
      currentSubmission.submission_id,
    );
    let totalFiles =
      Number(fileStats?.capstone_paper_count || 0) +
      Number(fileStats?.dataset_count || 0);

    // If the new draft version has no files, inherit file references from the latest
    // previous version of the same task so students don't need to re-upload unchanged files.
    if (totalFiles < 1) {
      const history = await listSubmissionsByGroupId(db, currentSubmission.group_id);
      const previousSameTask = (history || []).find(
        (entry) =>
          Number(entry.submission_id) !== Number(currentSubmission.submission_id) &&
          Number(entry.task_id) === Number(currentSubmission.task_id),
      );

      if (previousSameTask) {
        const previousFiles = await listSubmissionFilesBySubmissionId(
          db,
          previousSameTask.submission_id,
        );

        for (const prevFile of previousFiles) {
          await insertSubmissionFile(db, {
            submissionId: currentSubmission.submission_id,
            fileName: prevFile.file_name,
            s3Key: prevFile.s3_key,
            fileType: prevFile.file_type,
            fileSize: prevFile.file_size,
            versionNo: currentSubmission.version_no,
          });
        }

        totalFiles = previousFiles.length;
      }
    }

    if (totalFiles < 1) {
      return res.status(400).json({
        message: "Upload at least one file before submitting.",
      });
    }

    const updated = await updateSubmissionStatus(db, {
      submissionId: currentSubmission.submission_id,
      status: "Submitted",
    });

    return res.status(200).json({
      message: "Submission sent for review.",
      submission: updated,
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
};

export const uploadCurrentStudentSubmissionFile = async (req, res, next) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) {
      return res
        .status(500)
        .json({ message: "Database client is not initialized." });
    }

    const userId = Number(req.auth?.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res
        .status(401)
        .json({ message: "Invalid authenticated user context." });
    }

    const { error, value } = uploadFileSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: "Invalid request body",
        details: error.details.map((item) => item.message),
      });
    }

    const resolvedTaskId = value.taskId ? Number(value.taskId) : null;
    const { group, currentSubmission } = await getCurrentSubmissionContext(
      db,
      userId,
      resolvedTaskId,
    );
    if (!currentSubmission) {
      return res.status(400).json({
        message:
          "No draft submission found. Save the submission first before uploading files.",
      });
    }

    const buffer = Buffer.from(value.contentBase64, "base64");
    const safeFileName = value.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const task = await findTaskById(db, currentSubmission.task_id);
    ensureTaskAcceptingSubmissions(task);
    const termLabel =
      task?.academic_year && task?.term_no
        ? `${task.academic_year}-term-${task.term_no}`
        : "unknown-term";
    const termSegment = task?.term_id
      ? `academic-term-${task.term_id}-${toS3Slug(termLabel)}`
      : `academic-term-unknown-${toS3Slug(termLabel)}`;
    const taskSegment = `task-${currentSubmission.task_id}-${toS3Slug(task?.task_name || "untitled-task")}`;
    const s3Key = `${termSegment}/${taskSegment}/group-${group.group_id}/submission-${currentSubmission.submission_id}/${Date.now()}-${safeFileName}`;

    await createObject({
      key: s3Key,
      body: buffer,
      contentType: value.contentType,
      metadata: {
        submissionid: String(currentSubmission.submission_id),
        groupid: String(group.group_id),
        uploadedby: String(userId),
      },
    });

    const inserted = await insertSubmissionFile(db, {
      submissionId: currentSubmission.submission_id,
      fileName: value.fileName,
      s3Key,
      fileType: inferFileType(value.fileName, value.contentType),
      fileSize: buffer.length,
      versionNo: currentSubmission.version_no,
    });

    return res.status(201).json({
      message: "File uploaded successfully.",
      file: mapSubmissionFile(inserted),
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
};

export const deleteCurrentStudentSubmissionFile = async (req, res, next) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) {
      return res
        .status(500)
        .json({ message: "Database client is not initialized." });
    }

    const userId = Number(req.auth?.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res
        .status(401)
        .json({ message: "Invalid authenticated user context." });
    }

    const fileId = Number(req.params.fileId);
    if (!Number.isInteger(fileId) || fileId <= 0) {
      return res.status(400).json({ message: "Invalid file ID." });
    }

    const file = await findSubmissionFileById(db, fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found." });
    }

    const taskId = parseOptionalTaskId(req.query.taskId);
    const { group } = await getCurrentSubmissionContext(db, userId, taskId);
    const fileSubmission = await findSubmissionById(db, Number(file.submission_id));

    if (!fileSubmission) {
      return res.status(404).json({ message: "Submission for this file was not found." });
    }

    const sameGroup = Number(fileSubmission.group_id) === Number(group.group_id);
    const sameTaskWhenSpecified =
      !taskId || Number(fileSubmission.task_id) === Number(taskId);

    if (!sameGroup || !sameTaskWhenSpecified) {
      return res.status(403).json({ message: "You are not allowed to delete this file." });
    }

    await deleteObject({ key: file.s3_key });
    const deleted = await deleteSubmissionFileById(db, fileId);

    return res.status(200).json({
      message: "File deleted.",
      fileId: deleted?.file_id || fileId,
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
};
