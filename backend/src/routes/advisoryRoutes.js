import express from "express";
import {
  requireAuth,
  requireRegisteredUser,
} from "../middlewares/authMiddleware.js";
import {
  getAdvisoryLoad,
  getMyGroups,
  getGroupMembers,
  addGroupMember,
  removeGroupMember,
  searchStudents,
  createGroup,
  deleteGroup,
  getCoordinatorTasks,
  getCoordinatorTerms,
  toggleCoordinatorTaskLock,
  toggleCoordinatorTaskAutoLock,
  createCoordinatorTask,
  updateCoordinatorTask,
  deleteCoordinatorTask,
  getReviewQueue,
  updateReviewStatus,
} from "../controllers/advisoryController.js";

const router = express.Router();

// GET /api/advisory/load -> advisory load rows + summary
router.get("/load", getAdvisoryLoad);

// GET /api/advisory/tasks -> all tasks with term/submission stats
router.get("/tasks", requireAuth, requireRegisteredUser, getCoordinatorTasks);

// GET /api/advisory/terms -> academic terms catalog for task forms
router.get("/terms", requireAuth, requireRegisteredUser, getCoordinatorTerms);

// PATCH /api/advisory/tasks/:taskId/lock-toggle -> lock/unlock a task
router.patch(
  "/tasks/:taskId/lock-toggle",
  requireAuth,
  requireRegisteredUser,
  toggleCoordinatorTaskLock,
);

// PATCH /api/advisory/tasks/:taskId/auto-lock-toggle -> toggle auto-lock after due date
router.patch(
  "/tasks/:taskId/auto-lock-toggle",
  requireAuth,
  requireRegisteredUser,
  toggleCoordinatorTaskAutoLock,
);

// POST /api/advisory/tasks -> create a new coordinator task
router.post(
  "/tasks",
  requireAuth,
  requireRegisteredUser,
  createCoordinatorTask,
);

// PUT /api/advisory/tasks/:taskId -> update a coordinator task
router.put(
  "/tasks/:taskId",
  requireAuth,
  requireRegisteredUser,
  updateCoordinatorTask,
);

// DELETE /api/advisory/tasks/:taskId -> delete a coordinator task
router.delete(
  "/tasks/:taskId",
  requireAuth,
  requireRegisteredUser,
  deleteCoordinatorTask,
);

// Review Queue for advisers
router.get(
  "/review-queue",
  requireAuth,
  requireRegisteredUser,
  getReviewQueue,
);

// Update submission status (adviser only)
router.put(
  "/submissions/:submissionId/status",
  requireAuth,
  requireRegisteredUser,
  updateReviewStatus,
);

// Authenticated endpoints for advisers
router.get("/my-groups", requireAuth, requireRegisteredUser, getMyGroups);
router.get(
  "/groups/:groupId/members",
  requireAuth,
  requireRegisteredUser,
  getGroupMembers,
);
router.post(
  "/groups/:groupId/members",
  requireAuth,
  requireRegisteredUser,
  addGroupMember,
);
router.delete(
  "/groups/:groupId/members/:studentId",
  requireAuth,
  requireRegisteredUser,
  removeGroupMember,
);

// Search students for picker
router.get("/students", requireAuth, requireRegisteredUser, searchStudents);

// Create a new group (adviser creates group)
router.post("/groups", requireAuth, requireRegisteredUser, createGroup);

// Delete a group (adviser only)
router.delete(
  "/groups/:groupId",
  requireAuth,
  requireRegisteredUser,
  deleteGroup,
);

export default router;
