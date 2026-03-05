import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import repositoryRoutes from "./routes/repositoryRoutes.js";

dotenv.config();
const app = express();

// Set middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow Google Sign-In popup communication
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/repository", repositoryRoutes);

export default app;
