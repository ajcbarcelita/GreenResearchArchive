import express from "express";
import { requireAuth, requireRegisteredUser } from "../middlewares/authMiddleware.js";
import {
	getAdvisoryLoad,
	getMyGroups,
	getGroupMembers,
	addGroupMember,
	removeGroupMember,
	searchStudents,
	createGroup,
	deleteGroup,
} from "../controllers/advisoryController.js";

const router = express.Router();

// GET /api/advisory/load -> advisory load rows + summary
router.get("/load", getAdvisoryLoad);

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
router.delete("/groups/:groupId", requireAuth, requireRegisteredUser, deleteGroup);

export default router;
