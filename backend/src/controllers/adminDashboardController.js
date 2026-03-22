import {
  getSystemStats,
  getRoleDistribution,
  getActiveSessionsList,
} from "../models/adminDashboardModel.js";
import { revokeSession } from "../models/userSessionModel.js";

// Helper to ensure admin access
const ensureAdmin = (req, res) => {
  const roleName = String(req.auth?.roleName || "")
    .trim()
    .toLowerCase();
  if (roleName !== "admin") {
    res
      .status(403)
      .json({ message: "Only Admin accounts can access this data." });
    return false;
  }
  return true;
};

export const getDashboardAnalytics = async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const db = req.app?.locals?.db;

    // Fetch all data in parallel for speed
    const [stats, roles, sessions] = await Promise.all([
      getSystemStats(db),
      getRoleDistribution(db),
      getActiveSessionsList(db),
    ]);

    // Calculate Role Percentages
    const totalUsers = roles.reduce((sum, r) => sum + r.count, 0);
    const roleDistribution = roles.map((r) => ({
      role: r.role,
      count: r.count,
      percentage: totalUsers > 0 ? Math.round((r.count / totalUsers) * 100) : 0,
    }));

    // Convert Bytes to GB (1 GB = 1073741824 bytes)
    const storageGB = (stats.totalBytes / 1073741824).toFixed(2);

    // Format active sessions table
    const activeSessionsTable = sessions.map((s) => ({
      sessionId: s.session_id || s.sessionId,
      user: `${s.fname || s.firstName} ${s.lname || s.lastName}`.trim(),
      email: s.email,
      ip: s.ip_address || s.ipAddress || "Unknown IP",

      // FIX: Check for both snake_case and camelCase!
      device: s.user_agent || s.userAgent || "Unknown Device",

      loginTime: s.created_at || s.createdAt,
    }));

    return res.status(200).json({
      message: "Dashboard analytics fetched",
      systemStats: {
        activeSessions: stats.activeSessions,
        storageUsed: `${storageGB} GB`,
        totalFiles: stats.totalFiles,
        newUsers30d: stats.newUsers30d,
      },
      roleDistribution,
      activeSessionsTable,
    });
  } catch (error) {
    return next(error);
  }
};

export const revokeSpecificSession = async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const db = req.app?.locals?.db;
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required." });
    }

    // Using the revokeSession function you already have in userSessionModel.js
    const success = await revokeSession(db, sessionId);

    if (!success) {
      return res
        .status(404)
        .json({ message: "Session not found or already revoked." });
    }

    return res.status(200).json({ message: "Session revoked successfully." });
  } catch (error) {
    return next(error);
  }
};
