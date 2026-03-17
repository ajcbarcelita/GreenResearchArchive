import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import advisoryRoutes from "./routes/advisoryRoutes.js";
import auditLogRoutes from "./routes/auditLogRoutes.js";
import adminProgramRoutes from "./routes/adminProgramRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import repositoryRoutes from "./routes/repositoryRoutes.js";
import studentSubmissionRoutes from "./routes/studentSubmissionRoutes.js";

dotenv.config();
const app = express();

// Set middleware
app.use(helmet());
app.use(cors());
// Base64 file uploads are larger than raw files; raise limits to avoid 413.
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

// Allow Google Sign-In popup communication
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/advisory", advisoryRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/admin/programs", adminProgramRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/repository", repositoryRoutes);
app.use("/api/submissions", studentSubmissionRoutes);

export default app;
