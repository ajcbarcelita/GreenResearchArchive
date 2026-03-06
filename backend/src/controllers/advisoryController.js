import { listAdvisoryLoadRows } from "../models/advisoryModel.js";

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
  latestSubmissionStatus: row.latest_submission_status || null,
  latestSubmittedAt: row.latest_submitted_at || null,
  latestVersionNo: row.latest_version_no ? toInt(row.latest_version_no) : null,
  latestIsLocked: row.latest_is_locked === true,
});

const buildSummary = (rows) => {
  const adviserIds = new Set(rows.map((row) => row.adviserId));
  const statusesNeedingAttention = new Set(["Revision Requested", "Under Review"]);

  return {
    totalAdvisers: adviserIds.size,
    totalGroups: rows.length,
    activeGroups: rows.filter((row) => row.groupIsActive).length,
    groupsWithoutSubmission: rows.filter((row) => !row.latestSubmissionStatus).length,
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
          filterData.map((row) => row.latestSubmissionStatus || "No Submission"),
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
