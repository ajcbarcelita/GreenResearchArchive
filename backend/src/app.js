import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import advisoryRoutes from "./routes/advisoryRoutes.js";
import auditLogRoutes from "./routes/auditLogRoutes.js";
import adminProgramRoutes from "./routes/adminProgramRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import coordinatorRoutes from "./routes/coordinatorRoutes.js";
import repositoryRoutes from "./routes/repositoryRoutes.js";
import studentSubmissionRoutes from "./routes/studentSubmissionRoutes.js";

dotenv.config();
const app = express();
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Set middleware
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
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
app.use("/api/coordinator", coordinatorRoutes);
app.use("/api/repository", repositoryRoutes);
app.use("/api/submissions", studentSubmissionRoutes);

export default app;
