import { Router } from "express";
import {
  getDashboardAnalytics,
  revokeSpecificSession,
} from "../controllers/adminDashboardController.js";
import {
  requireAuth,
  requireRegisteredUser,
} from "../middlewares/authMiddleware.js";

const router = Router();

// GET /api/admin/dashboard
router.get("/", requireAuth, requireRegisteredUser, getDashboardAnalytics);

// POST /api/admin/dashboard/sessions/:sessionId/revoke
router.post(
  "/sessions/:sessionId/revoke",
  requireAuth,
  requireRegisteredUser,
  revokeSpecificSession,
);

export default router;
