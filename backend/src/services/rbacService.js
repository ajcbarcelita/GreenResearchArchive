const parseEmailList = (value = "") =>
  value
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

export const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

export const buildRbacConfig = () => ({
  adminWhitelist: parseEmailList(process.env.RBAC_ADMIN_EMAILS || ""),
  coordinatorWhitelist: parseEmailList(process.env.RBAC_COORDINATOR_EMAILS || ""),
  facultyWhitelist: parseEmailList(process.env.RBAC_FACULTY_EMAILS || ""),
  studentWhitelist: parseEmailList(process.env.RBAC_STUDENT_EMAILS || ""),
  blacklist: parseEmailList(process.env.RBAC_BLACKLIST_EMAILS || ""),
});

export const getRbacEmailDecision = (email) => {
  const normalizedEmail = normalizeEmail(email);
  const config = buildRbacConfig();

  if (config.adminWhitelist.includes(normalizedEmail)) {
    return { normalizedEmail, rule: "admin-whitelist" };
  }

  if (config.coordinatorWhitelist.includes(normalizedEmail)) {
    return { normalizedEmail, rule: "coordinator-whitelist" };
  }

  if (config.facultyWhitelist.includes(normalizedEmail)) {
    return { normalizedEmail, rule: "faculty-whitelist" };
  }

  if (config.studentWhitelist.includes(normalizedEmail)) {
    return { normalizedEmail, rule: "student-whitelist" };
  }

  if (config.blacklist.includes(normalizedEmail)) {
    return { normalizedEmail, rule: "blacklist" };
  }

  return { normalizedEmail, rule: "none" };
};
