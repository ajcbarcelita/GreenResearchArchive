import {
  getSubmissionOverview,
  getPendingActions,
  getComplianceAlerts,
  getLiveSubmissions,
  getPendingFinalValidation,
  getArchivedSubmissions,
  getResearchFields,
  getAllUsers,
  getAuditLogs,
  getKeywordPopularity,
  getResearchTrends,
  getAdviserMetrics,
  getSubmissionStatusOverTime,
  getProgramStatistics,
  getRepositoryHealth,
  getPerformanceIndicators,
  getPrograms,
  getAdvisers
} from "../queries/coordinatorQueries.js";
import logger from "../utils/logger.js";

// Analytics endpoints
export const getAnalyticsOverview = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });
    
    const overview = await db.query(getSubmissionOverview);
    return res.json({ data: overview.rows });
  } catch (error) {
    logger.error("Error fetching analytics overview:", error);
    return res.status(500).json({ error: "Failed to fetch analytics overview" });
  }
};

export const getKeywordAnalytics = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });
    
    const keywords = await db.query(getKeywordPopularity);
    return res.json({ data: keywords.rows });
  } catch (error) {
    logger.error("Error fetching keyword analytics:", error);
    return res.status(500).json({ error: "Failed to fetch keyword analytics" });
  }
};

export const getResearchTrendsAnalytics = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });
    
    const trends = await db.query(getResearchTrends);
    return res.json({ data: trends.rows });
  } catch (error) {
    logger.error("Error fetching research trends:", error);
    return res.status(500).json({ error: "Failed to fetch research trends" });
  }
};

export const getAdviserWorkloadAnalytics = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });
    
    const workload = await db.query(getAdviserMetrics);
    return res.json({ data: workload.rows });
  } catch (error) {
    logger.error("Error fetching adviser workload:", error);
    return res.status(500).json({ error: "Failed to fetch adviser workload" });
  }
};

export const getRepositoryHealthAnalytics = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });
    
    const health = await db.query(getRepositoryHealth);
    return res.json({ data: health.rows[0] || {} });
  } catch (error) {
    logger.error("Error fetching repository health:", error);
    return res.status(500).json({ error: "Failed to fetch repository health" });
  }
};

export const getPerformanceIndicatorsAnalytics = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });
    
    const indicators = await db.query(getPerformanceIndicators);
    return res.json({ data: indicators.rows });
  } catch (error) {
    logger.error("Error fetching performance indicators:", error);
    return res.status(500).json({ error: "Failed to fetch performance indicators" });
  }
};

// Submissions management
export const getLiveSubmissionsList = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });
    
    const submissions = await db.query(getLiveSubmissions);
    return res.json({ data: submissions.rows });
  } catch (error) {
    logger.error("Error fetching live submissions:", error);
    return res.status(500).json({ error: "Failed to fetch live submissions" });
  }
};

export const getPendingValidationsList = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });
    
    const validations = await db.query(getPendingFinalValidation);
    return res.json({ data: validations.rows });
  } catch (error) {
    logger.error("Error fetching pending validations:", error);
    return res.status(500).json({ error: "Failed to fetch pending validations" });
  }
};

export const updateSubmissionStatus = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });
    const { submissionId, status, remarks } = req.body;

    // Update submission status
    await db.query(
      `UPDATE submissions SET status = $1 WHERE submission_id = $2`,
      [status, submissionId]
    );

    // Log the change
    await db.query(
      `INSERT INTO submission_audit_logs (submission_id, changed_by, old_status, new_status, remarks)
       VALUES ($1, $2, (SELECT status FROM submissions WHERE submission_id = $1), $3, $4)`,
      [submissionId, req.auth?.sub, status, remarks || '']
    );

    return res.json({ data: { success: true } });
  } catch (error) {
    logger.error("Error updating submission status:", error);
    return res.status(500).json({ error: "Failed to update submission status" });
  }
};

export const lockSubmission = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });
    const { submissionId } = req.params;
    const { locked } = req.body;

    await db.query(
      `UPDATE submissions SET is_locked = $1 WHERE submission_id = $2`,
      [locked, submissionId]
    );

    return res.json({ data: { success: true } });
  } catch (error) {
    logger.error("Error locking submission:", error);
    return res.status(500).json({ error: "Failed to lock submission" });
  }
};

// Utility endpoints
export const getProgramsList = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });
    
    const programs = await db.query(getPrograms);
    return res.json({ data: programs.rows });
  } catch (error) {
    logger.error("Error fetching programs:", error);
    return res.status(500).json({ error: "Failed to fetch programs" });
  }
};

export const getAdvisersList = async (req, res) => {
  try {
    const db = req.app?.locals?.db;
    if (!db) return res.status(500).json({ error: "Database not initialized" });
    
    const advisers = await db.query(getAdvisers);
    return res.json({ data: advisers.rows });
  } catch (error) {
    logger.error("Error fetching advisers:", error);
    return res.status(500).json({ error: "Failed to fetch advisers" });
  }
};