import Joi from "joi";
import { listDegreePrograms } from "../models/degreeProgramModel.js";
import {
  findUserById,
  listUsersForAdmin,
  updateAdminManagedUser,
} from "../models/userModel.js";
import { findRoleByNameExact } from "../models/roleModel.js";

const querySchema = Joi.object({
  q: Joi.string().trim().max(100).allow("", null),
  roleId: Joi.number().integer().positive().allow(null),
  programId: Joi.number().integer().positive().allow(null),
  isActive: Joi.string().trim().valid("true", "false", "").allow(null),
});

const updateSchema = Joi.object({
  roleId: Joi.number().integer().positive().required(),
  programId: Joi.number().integer().positive().allow(null),
  isActive: Joi.boolean().required(),
});

const ensureAdmin = (req, res) => {
  const roleName = String(req.auth?.roleName || "")
    .trim()
    .toLowerCase();
  if (roleName !== "admin") {
    res.status(403).json({ message: "Only Admin accounts can manage users." });
    return false;
  }

  return true;
};

const toInt = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) ? parsed : null;
};

const toBoolean = (value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
};

const mapUser = (row) => ({
  userId: row.user_id,
  email: row.email,
  universityId: row.university_id,
  firstName: row.fname,
  lastName: row.lname,
  middleName: row.mname,
  fullName: [row.fname, row.mname, row.lname].filter(Boolean).join(" "),
  roleId: row.role_id,
  roleName: row.role_name,
  programId: row.program_id,
  programCode: row.program_code,
  programName: row.program_name,
  isActive: row.is_active,
  createdAt: row.created_at,
  lastLogin: row.last_login,
});

export const listAdminUsers = async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const normalizedQuery = {
      q: req.query.q || null,
      roleId: toInt(req.query.roleId),
      programId: toInt(req.query.programId),
      isActive: req.query.isActive || null,
    };

    const { error, value } = querySchema.validate(normalizedQuery, {
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
    const rows = await listUsersForAdmin(db, {
      q: value.q || null,
      roleId: value.roleId || null,
      programId: value.programId || null,
      isActive: toBoolean(value.isActive),
    });

    const [rolesResult, programsResult] = await Promise.all([
      db.query(
        `
          SELECT role_id, role_name
          FROM ref_roles
          ORDER BY role_name ASC
        `,
      ),
      listDegreePrograms(db),
    ]);

    return res.status(200).json({
      message: "Users fetched",
      users: rows.map(mapUser),
      filters: {
        roles: rolesResult.rows.map((row) => ({
          roleId: row.role_id,
          roleName: row.role_name,
        })),
        programs: programsResult.map((row) => ({
          programId: row.program_id,
          programCode: row.program_code,
          programName: row.program_name,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateAdminUser = async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    const { error, value } = updateSchema.validate(req.body, {
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
    const existing = await findUserById(db, userId);
    if (!existing) {
      return res.status(404).json({ message: "User not found." });
    }

    const roleLookup = await db.query(
      `
        SELECT role_id, role_name
        FROM ref_roles
        WHERE role_id = $1
        LIMIT 1
      `,
      [value.roleId],
    );

    const selectedRole = roleLookup.rows[0] || null;
    if (!selectedRole) {
      return res.status(400).json({ message: "Selected role does not exist." });
    }

    const isStudent =
      String(selectedRole.role_name || "")
        .trim()
        .toLowerCase() === "student";
    if (isStudent && !value.programId) {
      return res.status(400).json({
        message: "Program is required for Student role.",
      });
    }

    if (!isStudent && value.programId) {
      return res.status(400).json({
        message: "Only Student users can have an assigned program.",
      });
    }

    if (!value.isActive && Number(req.auth?.sub) === userId) {
      return res.status(400).json({
        message: "Admin cannot deactivate their own account.",
      });
    }

    const updated = await updateAdminManagedUser(db, {
      userId,
      roleId: value.roleId,
      programId: value.programId || null,
      isActive: value.isActive,
    });

    return res.status(200).json({
      message: "User updated",
      user: {
        userId: updated.user_id,
        roleId: updated.role_id,
        programId: updated.program_id,
        isActive: updated.is_active,
      },
    });
  } catch (error) {
    if (error?.code === "23503") {
      return res.status(400).json({
        message: "Selected role or program does not exist.",
      });
    }

    if (error?.code === "23505") {
      return res.status(409).json({
        message: "A unique user field conflict occurred while updating.",
      });
    }

    return next(error);
  }
};

export const getAdminUserMeta = async (req, res, next) => {
  try {
    if (!ensureAdmin(req, res)) return;

    const db = req.app?.locals?.db;
    const [rolesResult, programsResult, studentRole] = await Promise.all([
      db.query(
        `
          SELECT role_id, role_name
          FROM ref_roles
          ORDER BY role_name ASC
        `,
      ),
      listDegreePrograms(db),
      findRoleByNameExact(db, "Student"),
    ]);

    return res.status(200).json({
      message: "User metadata fetched",
      roles: rolesResult.rows.map((row) => ({
        roleId: row.role_id,
        roleName: row.role_name,
      })),
      programs: programsResult.map((row) => ({
        programId: row.program_id,
        programCode: row.program_code,
        programName: row.program_name,
      })),
      studentRoleId: studentRole?.role_id || null,
    });
  } catch (error) {
    return next(error);
  }
};
