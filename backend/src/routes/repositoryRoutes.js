import express from "express";
import {
  listRepository,
  getRepositoryById,
  toggleRepositoryArchiveStatus,
  listRepositorySubmissionFiles,
  downloadRepositorySubmissionFile,
} from "../controllers/repositoryController.js";

const router = express.Router();

// GET /api/repository  -> list
router.get("/", listRepository);

// GET /api/repository/:id -> details
router.get("/:id", getRepositoryById);

// GET /api/repository/:id/files -> list files for a submission
router.get("/:id/files", listRepositorySubmissionFiles);

// GET /api/repository/files/:fileId/download -> stream a submission file from S3
router.get("/files/:fileId/download", downloadRepositorySubmissionFile);

// PATCH /api/repository/:id/archive-toggle -> archive/unarchive submission
router.patch("/:id/archive-toggle", toggleRepositoryArchiveStatus);

export default router;
