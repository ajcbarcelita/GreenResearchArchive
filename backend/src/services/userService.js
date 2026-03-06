import {
  findDegreeProgramById,
  listDegreePrograms as listDegreeProgramsModel,
} from "../models/degreeProgramModel.js";
import {
  createRole,
  findRoleByNameExact,
  findRoleByNameLike,
  findRoleNameById,
} from "../models/roleModel.js";
import { getRbacEmailDecision } from "./rbacService.js";
import {
  completeUserFirstLoginProfile,
  existsUserByGoogleIdOrEmail,
  findUserByGoogleIdOrEmail,
  findUserById,
  insertUserFromOnboarding,
  updateUserLoginWithGoogle,
} from "../models/userModel.js";

const ROLE_NAMES = {
  ADMIN: "Admin",
  COORDINATOR: "Coordinator",
  FACULTY: "Faculty",
  STUDENT: "Student",
};

const EMAIL_PATTERNS = {
  STUDENT: /_/,
  FACULTY: /\./,
};

const toTitleCase = (value = "") => {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const splitName = (profile = {}) => {
  const firstName = profile.givenName || profile.firstName || "";
  const lastName = profile.familyName || profile.lastName || "";

  if (firstName && lastName) {
    return {
      fname: toTitleCase(firstName),
      lname: toTitleCase(lastName),
      mname: null,
    };
  }

  const fullName = (profile.name || "").trim();
  if (!fullName) {
    return {
      fname: "Unknown",
      lname: "User",
      mname: null,
    };
  }

  const parts = fullName.split(/\s+/);
  if (parts.length === 1) {
    return {
      fname: toTitleCase(parts[0]),
      lname: "User",
      mname: null,
    };
  }

  return {
    fname: toTitleCase(parts[0]),
    lname: toTitleCase(parts[parts.length - 1]),
    mname: parts.length > 2 ? toTitleCase(parts.slice(1, -1).join(" ")) : null,
  };
};

const ensureDb = (db) => {
  if (!db) {
    const error = new Error("Database client is not initialized");
    error.statusCode = 500;
    throw error;
  }
};

const resolveRoleFromEmail = (email) => {
  const { normalizedEmail, rule } = getRbacEmailDecision(email);
  const localPart = normalizedEmail.split("@")[0] || "";

  if (rule === "admin-whitelist") {
    return ROLE_NAMES.ADMIN;
  }

  if (rule === "coordinator-whitelist") {
    return ROLE_NAMES.COORDINATOR;
  }

  if (rule === "faculty-whitelist") {
    return ROLE_NAMES.FACULTY;
  }

  if (rule === "student-whitelist") {
    return ROLE_NAMES.STUDENT;
  }

  if (rule === "blacklist") {
    const error = new Error(
      "Access denied. This email is blocked from sign in.",
    );
    error.statusCode = 403;
    throw error;
  }

  if (EMAIL_PATTERNS.STUDENT.test(localPart)) {
    return ROLE_NAMES.STUDENT;
  }

  if (EMAIL_PATTERNS.FACULTY.test(localPart)) {
    return ROLE_NAMES.FACULTY;
  }

  return ROLE_NAMES.STUDENT;
};

const resolveRoleIdByName = async (db, roleName) => {
  const exactRole = await findRoleByNameExact(db, roleName);
  if (exactRole) return exactRole;

  const fuzzyRole = await findRoleByNameLike(db, roleName);
  if (fuzzyRole) return fuzzyRole;

  return createRole(db, roleName);
};

const mapUserWithRole = async (db, userRow) => {
  const roleName = await findRoleNameById(db, userRow.role_id);

  return {
    ...userRow,
    role_name: roleName,
  };
};

const ensureGoogleProfile = (profile) => {
  const googleId = profile?.id;
  const email = (profile?.email || "").toLowerCase().trim();

  if (!googleId || !email) {
    const error = new Error("Invalid Google profile payload");
    error.statusCode = 400;
    throw error;
  }

  return { googleId, email };
};

const rethrowUniqueConstraint = (error) => {
  if (error?.code === "23505" && error?.constraint === "uni_id_idx") {
    const duplicateError = new Error("University ID is already in use.");
    duplicateError.statusCode = 409;
    throw duplicateError;
  }

  if (error?.code === "23505") {
    const duplicateError = new Error(
      "A unique value already exists for this account.",
    );
    duplicateError.statusCode = 409;
    throw duplicateError;
  }

  throw error;
};

export const findGoogleUser = async (db, profile) => {
  ensureDb(db);
  const { googleId, email } = ensureGoogleProfile(profile);

  const existingUser = await findUserByGoogleIdOrEmail(db, { googleId, email });
  if (!existingUser) return null;

  return mapUserWithRole(db, existingUser);
};

export const updateGoogleUserLogin = async (db, profile) => {
  ensureDb(db);
  const { googleId, email } = ensureGoogleProfile(profile);

  const existingUser = await findGoogleUser(db, profile);
  if (!existingUser) return null;

  const { fname, lname, mname } = splitName(profile);
  const roleName = resolveRoleFromEmail(email);
  const role = await resolveRoleIdByName(db, roleName);

  const updatedUser = await updateUserLoginWithGoogle(db, {
    googleId,
    email,
    fname,
    lname,
    mname,
    roleId: role.role_id,
    userId: existingUser.user_id,
  });

  return {
    ...updatedUser,
    role_name: role.role_name,
  };
};

export const buildOnboardingProfile = (profile) => {
  const { googleId, email } = ensureGoogleProfile(profile);

  return {
    googleId,
    email,
    name: profile.name || null,
    givenName: profile.givenName || null,
    familyName: profile.familyName || null,
    roleName: resolveRoleFromEmail(email),
  };
};

export const createUserFromOnboarding = async (
  db,
  { googleId, email, firstName, lastName, middleName, programId, universityId },
) => {
  ensureDb(db);

  const roleName = resolveRoleFromEmail(email);
  const requiresProgram = roleName === ROLE_NAMES.STUDENT;
  const role = await resolveRoleIdByName(db, roleName);

  if (requiresProgram) {
    if (!programId) {
      const error = new Error("Degree program is required for Student accounts.");
      error.statusCode = 400;
      throw error;
    }

    const programExists = await findDegreeProgramById(db, programId);
    if (!programExists) {
      const error = new Error("Selected degree program does not exist.");
      error.statusCode = 400;
      throw error;
    }
  }

  const userExists = await existsUserByGoogleIdOrEmail(db, { googleId, email });
  if (userExists) {
    const error = new Error("Account already exists. Please sign in again.");
    error.statusCode = 409;
    throw error;
  }

  try {
    const insertedUser = await insertUserFromOnboarding(db, {
      googleId,
      email,
      universityId,
      firstName,
      lastName,
      middleName,
      programId: requiresProgram ? programId : null,
      roleId: role.role_id,
    });

    return {
      ...insertedUser,
      role_name: role.role_name,
    };
  } catch (error) {
    rethrowUniqueConstraint(error);
  }
};

export const getDegreePrograms = async (db) => {
  ensureDb(db);
  return listDegreeProgramsModel(db);
};

export const completeFirstLoginProfile = async (
  db,
  { userId, firstName, lastName, middleName, programId, universityId, roleName },
) => {
  ensureDb(db);
  const requiresProgram = String(roleName || "").trim().toLowerCase() === "student";

  if (requiresProgram) {
    if (!programId) {
      const error = new Error("Degree program is required for Student accounts.");
      error.statusCode = 400;
      throw error;
    }

    const programExists = await findDegreeProgramById(db, programId);
    if (!programExists) {
      const error = new Error("Selected degree program does not exist.");
      error.statusCode = 400;
      throw error;
    }
  }

  let updatedUser;
  try {
    updatedUser = await completeUserFirstLoginProfile(db, {
      userId,
      universityId,
      firstName,
      lastName,
      middleName,
      programId: requiresProgram ? programId : null,
    });
  } catch (error) {
    rethrowUniqueConstraint(error);
  }

  if (updatedUser) {
    const roleName = await findRoleNameById(db, updatedUser.role_id);
    return {
      ...updatedUser,
      role_name: roleName,
    };
  }

  const existingUser = await findUserById(db, userId);
  if (!existingUser) {
    const error = new Error("User was not found.");
    error.statusCode = 404;
    throw error;
  }

  const error = new Error("Profile is already completed for this account.");
  error.statusCode = 409;
  throw error;
};
