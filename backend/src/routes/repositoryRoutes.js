import express from "express";
import {
  requireAuth,
  requireRegisteredUser,
} from "../middlewares/authMiddleware.js";
import {
  listRepository,
  getRepositoryById,
  toggleRepositoryArchiveStatus,
  listRepositorySubmissionFiles,
  downloadRepositorySubmissionFile,
  addRepositoryComment,
  listRepositoryComments,
} from "../controllers/repositoryController.js";

const router = express.Router();

// GET /api/repository  -> list
router.get("/", listRepository);

// GET /api/repository/:id -> details
router.get("/:id", getRepositoryById);

// GET /api/repository/:id/files -> list files for a submission
router.get("/:id/files", listRepositorySubmissionFiles);

// POST /api/repository/:id/comments -> add faculty/coordinator comment to audit logs
router.post(
  "/:id/comments",
  requireAuth,
  requireRegisteredUser,
  addRepositoryComment,
);

// GET /api/repository/:id/comments -> list previous comments (faculty/coordinator only)
router.get(
  "/:id/comments",
  requireAuth,
  requireRegisteredUser,
  listRepositoryComments,
);

// GET /api/repository/files/:fileId/download -> stream a submission file from S3
router.get("/files/:fileId/download", downloadRepositorySubmissionFile);

// PATCH /api/repository/:id/archive-toggle -> archive/unarchive submission
router.patch("/:id/archive-toggle", toggleRepositoryArchiveStatus);

export default router;
