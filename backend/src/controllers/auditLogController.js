import {
  getAuditLogFilterOptions,
  listAuditLogs,
} from "../models/auditLogModel.js";

const toInt = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
};

const mapAuditLogRow = (row) => ({
  logId: row.log_id,
  submissionId: row.submission_id,
  groupId: row.group_id,
  groupName: row.group_name,
  programCode: row.program_code,
  programName: row.program_name,
  changedAt: row.changed_at,
  oldStatus: row.old_status,
  newStatus: row.new_status,
  currentStatus: row.current_status,
  remarks: row.remarks,
  versionNo: row.version_no,
  submissionTitle: row.submission_title,
  changedBy: row.changed_by,
  actorName: [row.actor_fname, row.actor_mname, row.actor_lname]
    .filter(Boolean)
    .join(" "),
  actorEmail: row.actor_email,
  actorRole: row.actor_role,
});

const buildSummary = (rows) => {
  const uniqueActors = new Set(rows.map((row) => row.changedBy));
  const today = new Date();
  const dayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const transitionCounts = new Map();
  rows.forEach((row) => {
    const key = `${row.oldStatus || "None"} -> ${row.newStatus || "None"}`;
    transitionCounts.set(key, (transitionCounts.get(key) || 0) + 1);
  });

  let mostCommonTransition = null;
  let mostCommonTransitionCount = 0;
  transitionCounts.forEach((count, transition) => {
    if (count > mostCommonTransitionCount) {
      mostCommonTransitionCount = count;
      mostCommonTransition = transition;
    }
  });

  return {
    totalLogs: rows.length,
    logsToday: rows.filter((row) => new Date(row.changedAt) >= dayStart).length,
    uniqueActors: uniqueActors.size,
    mostCommonTransition,
    mostCommonTransitionCount,
  };
};

export const getAuditLogs = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) {
      return res.status(500).json({ error: "Database not initialized" });
    }

    const filters = {
      q: req.query.q || null,
      submissionId: toInt(req.query.submissionId),
      changedBy: toInt(req.query.changedBy),
      programCode: req.query.programCode || null,
      oldStatus: req.query.oldStatus || null,
      newStatus: req.query.newStatus || null,
      dateFrom: req.query.dateFrom || null,
      dateTo: req.query.dateTo || null,
    };

    const rows = await listAuditLogs(db, filters);
    const data = rows.map(mapAuditLogRow);
    const summary = buildSummary(data);
    const filterOptions = await getAuditLogFilterOptions(db);

    return res.json({
      data,
      summary,
      filters: filterOptions,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
