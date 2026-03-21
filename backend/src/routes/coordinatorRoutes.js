import express from "express";
import {
  getAnalyticsOverview,
  getKeywordAnalytics,
  getResearchTrendsAnalytics,
  getAdviserWorkloadAnalytics,
  getRepositoryHealthAnalytics,
  getPerformanceIndicatorsAnalytics,
  getLiveSubmissionsList,
  getPendingValidationsList,
  updateSubmissionStatus,
  lockSubmission,
  getProgramsList,
  getAdvisersList
} from "../controllers/coordinatorController.js";
import {
  requireAuth,
  requireRegisteredUser,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Analytics routes
router.get("/analytics/overview", requireAuth, getAnalyticsOverview);
router.get("/analytics/keywords", requireAuth, getKeywordAnalytics);
router.get("/analytics/trends", requireAuth, getResearchTrendsAnalytics);
router.get("/analytics/advisers", requireAuth, getAdviserWorkloadAnalytics);
router.get("/analytics/health", requireAuth, getRepositoryHealthAnalytics);
router.get("/analytics/performance", requireAuth, getPerformanceIndicatorsAnalytics);

// Submissions management
router.get("/submissions/live", requireAuth, getLiveSubmissionsList);
router.get("/submissions/pending-validation", requireAuth, getPendingValidationsList);
router.put("/submissions/:submissionId/status", requireAuth, updateSubmissionStatus);
router.put("/submissions/:submissionId/lock", requireAuth, lockSubmission);

// Utility routes
router.get("/programs", requireAuth, getProgramsList);
router.get("/advisers", requireAuth, getAdvisersList);

export default router;