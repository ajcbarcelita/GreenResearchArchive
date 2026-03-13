import Joi from "joi";
import {
  deleteDegreeProgramById,
  findDegreeProgramByCode,
  findDegreeProgramById,
  insertDegreeProgram,
  listDegreeProgramsForAdmin,
  updateDegreeProgramById,
} from "../models/degreeProgramModel.js";

const PROGRAM_LEVELS = ["Baccalaureate", "Master's", "Doctorate"];

const listProgramsQuerySchema = Joi.object({
  q: Joi.string().trim().max(100).allow("", null),
  level: Joi.string()
    .trim()
    .valid(...PROGRAM_LEVELS)
    .allow("", null),
});

const upsertProgramSchema = Joi.object({
  programCode: Joi.string().trim().max(10).required(),
  programName: Joi.string().trim().max(100).required(),
  programLevel: Joi.string()
    .trim()
    .valid(...PROGRAM_LEVELS)
    .required(),
});

const normalizeCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const ensureAdmin = (req, res) => {
  const roleName = String(req.auth?.roleName || "")
    .trim()
    .toLowerCase();
  if (roleName !== "admin") {
    res.status(403).json({
      message: "Only Admin accounts can manage programs.",
    });
    return false;
  }

  return true;
};

export const listPrograms = async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { error, value } = listProgramsQuerySchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: "Invalid request query",
        details: error.details.map((item) => item.message),
      });
    }

    const db = req.app?.locals?.db;
    const rows = await listDegreeProgramsForAdmin(db, {
      q: value.q || null,
      level: value.level || null,
    });

    return res.status(200).json({
      message: "Programs fetched",
      programs: rows.map((row) => ({
        programId: row.program_id,
        programCode: row.program_code,
        programName: row.program_name,
        programLevel: row.program_level,
        studentsCount: row.user_count,
        groupsCount: row.group_count,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

export const createProgram = async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const { error, value } = upsertProgramSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: "Invalid request body",
        details: error.details.map((item) => item.message),
      });
    }

    const db = req.app?.locals?.db;
    const normalizedCode = normalizeCode(value.programCode);

    const duplicate = await findDegreeProgramByCode(db, {
      code: normalizedCode,
    });

    if (duplicate) {
      return res.status(409).json({
        message: "Program code already exists.",
      });
    }

    const inserted = await insertDegreeProgram(db, {
      programCode: normalizedCode,
      programName: value.programName.trim(),
      programLevel: value.programLevel,
    });

    return res.status(201).json({
      message: "Program created",
      program: {
        programId: inserted.program_id,
        programCode: inserted.program_code,
        programName: inserted.program_name,
        programLevel: inserted.program_level,
      },
    });
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({
        message: "Program code already exists.",
      });
    }

    return next(error);
  }
};

export const updateProgram = async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const programId = Number(req.params.programId);
    if (!Number.isInteger(programId) || programId <= 0) {
      return res.status(400).json({
        message: "Invalid program ID.",
      });
    }

    const { error, value } = upsertProgramSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: "Invalid request body",
        details: error.details.map((item) => item.message),
      });
    }

    const db = req.app?.locals?.db;
    const existing = await findDegreeProgramById(db, programId);
    if (!existing) {
      return res.status(404).json({
        message: "Program not found.",
      });
    }

    const normalizedCode = normalizeCode(value.programCode);
    const duplicate = await findDegreeProgramByCode(db, {
      code: normalizedCode,
      excludeProgramId: programId,
    });

    if (duplicate) {
      return res.status(409).json({
        message: "Program code already exists.",
      });
    }

    const updated = await updateDegreeProgramById(db, {
      programId,
      programCode: normalizedCode,
      programName: value.programName.trim(),
      programLevel: value.programLevel,
    });

    return res.status(200).json({
      message: "Program updated",
      program: {
        programId: updated.program_id,
        programCode: updated.program_code,
        programName: updated.program_name,
        programLevel: updated.program_level,
      },
    });
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({
        message: "Program code already exists.",
      });
    }

    return next(error);
  }
};

export const deleteProgram = async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const programId = Number(req.params.programId);
    if (!Number.isInteger(programId) || programId <= 0) {
      return res.status(400).json({
        message: "Invalid program ID.",
      });
    }

    const db = req.app?.locals?.db;
    const existing = await findDegreeProgramById(db, programId);
    if (!existing) {
      return res.status(404).json({
        message: "Program not found.",
      });
    }

    const deleted = await deleteDegreeProgramById(db, programId);
    if (!deleted) {
      return res.status(404).json({
        message: "Program not found.",
      });
    }

    return res.status(200).json({
      message: "Program deleted",
      deletedProgramId: deleted.program_id,
    });
  } catch (error) {
    if (error?.code === "23503") {
      return res.status(409).json({
        message:
          "Program cannot be deleted because it is still linked to users or groups.",
      });
    }

    return next(error);
  }
};
