import express from "express";
import { getAuditLogs } from "../controllers/auditLogController.js";

const router = express.Router();

// GET /api/audit-logs -> list audit logs + summary + filter options
router.get("/", getAuditLogs);

export default router;
