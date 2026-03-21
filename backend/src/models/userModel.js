export const findUserByGoogleIdOrEmail = async (db, { googleId, email }) => {
  const result = await db.query(
    `
      SELECT user_id, email, university_id, fname, lname, mname, program_id, role_id, is_active, last_login
      FROM users
      WHERE google_id = $1 OR email = $2
      LIMIT 1
    `,
    [googleId, email],
  );

  return result.rows[0] || null;
};

export const existsUserByGoogleIdOrEmail = async (db, { googleId, email }) => {
  const result = await db.query(
    `
      SELECT user_id
      FROM users
      WHERE google_id = $1 OR email = $2
      LIMIT 1
    `,
    [googleId, email],
  );

  return result.rowCount > 0;
};

export const updateUserLoginWithGoogle = async (
  db,
  { googleId, email, fname, lname, mname, roleId, userId },
) => {
  const result = await db.query(
    `
      UPDATE users
      SET
        google_id = $1,
        email = $2,
        fname = $3,
        lname = $4,
        mname = $5,
        role_id = $6,
        last_login = CURRENT_TIMESTAMP,
        is_active = true
      WHERE user_id = $7
      RETURNING user_id, email, university_id, fname, lname, mname, program_id, role_id, is_active, last_login
    `,
    [googleId, email, fname, lname, mname, roleId, userId],
  );

  return result.rows[0];
};

export const insertUserFromOnboarding = async (
  db,
  {
    googleId,
    email,
    universityId,
    firstName,
    lastName,
    middleName,
    programId,
    roleId,
  },
) => {
  const result = await db.query(
    `
      INSERT INTO users (google_id, email, university_id, fname, lname, mname, program_id, role_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING user_id, email, university_id, fname, lname, mname, program_id, role_id, is_active, created_at, last_login
    `,
    [
      googleId,
      email,
      universityId,
      firstName,
      lastName,
      middleName,
      programId,
      roleId,
    ],
  );

  return result.rows[0];
};

export const completeUserFirstLoginProfile = async (
  db,
  { userId, universityId, firstName, lastName, middleName, programId },
) => {
  const result = await db.query(
    `
      UPDATE users
      SET
        university_id = $1,
        fname = $2,
        lname = $3,
        mname = $4,
        program_id = $5,
        last_login = CURRENT_TIMESTAMP,
        is_active = true
      WHERE user_id = $6
        AND last_login IS NULL
      RETURNING user_id, email, university_id, fname, lname, mname, program_id, role_id, is_active, last_login
    `,
    [universityId, firstName, lastName, middleName, programId, userId],
  );

  return result.rows[0] || null;
};

export const findUserById = async (db, userId) => {
  const result = await db.query(
    `
      SELECT user_id, last_login
      FROM users
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId],
  );

  return result.rows[0] || null;
};

export const findUserProfileById = async (db, userId) => {
  const result = await db.query(
    `
      SELECT
        u.user_id,
        u.email,
        u.university_id,
        u.fname,
        u.lname,
        u.mname,
        u.program_id,
        u.role_id,
        u.is_active,
        u.last_login,
        rr.role_name,
        rp.program_code,
        rp.program_name
      FROM users u
      LEFT JOIN ref_roles rr ON rr.role_id = u.role_id
      LEFT JOIN ref_degree_programs rp ON rp.program_id = u.program_id
      WHERE u.user_id = $1
      LIMIT 1
    `,
    [userId],
  );

  return result.rows[0] || null;
};

export const listUsersForAdmin = async (
  db,
  { q, roleId, programId, isActive } = {},
) => {
  const params = [];
  const whereClauses = [];

  if (q) {
    params.push(`%${q}%`);
    whereClauses.push(
      `(u.email ILIKE $${params.length}
        OR u.university_id ILIKE $${params.length}
        OR u.fname ILIKE $${params.length}
        OR u.lname ILIKE $${params.length}
        OR (u.fname || ' ' || COALESCE(u.mname || ' ', '') || u.lname) ILIKE $${params.length})`,
    );
  }

  if (roleId) {
    params.push(roleId);
    whereClauses.push(`u.role_id = $${params.length}`);
  }

  if (programId) {
    params.push(programId);
    whereClauses.push(`u.program_id = $${params.length}`);
  }

  if (isActive !== null && isActive !== undefined) {
    params.push(isActive);
    whereClauses.push(`u.is_active = $${params.length}`);
  }

  const where = whereClauses.length
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";

  const result = await db.query(
    `
      SELECT
        u.user_id,
        u.email,
        u.university_id,
        u.fname,
        u.lname,
        u.mname,
        u.program_id,
        u.role_id,
        u.is_active,
        u.created_at,
        u.last_login,
        rr.role_name,
        rp.program_code,
        rp.program_name
      FROM users u
      LEFT JOIN ref_roles rr ON rr.role_id = u.role_id
      LEFT JOIN ref_degree_programs rp ON rp.program_id = u.program_id
      ${where}
      ORDER BY u.created_at DESC, u.user_id DESC
    `,
    params,
  );

  return result.rows;
};

export const updateAdminManagedUser = async (
  db,
  { userId, roleId, programId, isActive, fname, mname, lname },
) => {
  const result = await db.query(
    `
      UPDATE users
      SET role_id = $1,
          program_id = $2,
          is_active = $3,
          fname = $4,
          mname = $5,
          lname = $6
      WHERE user_id = $7
      RETURNING user_id, role_id, program_id, is_active, fname, mname, lname
    `,
    [roleId, programId, isActive, fname, mname, lname, userId],
  );

  return result.rows[0] || null;
};

// userSessionModel.js
export const revokeSessionsByUserId = async (db, userId) => {
  const result = await db.query(
    `UPDATE user_sessions
     SET is_revoked = true
     WHERE user_id = $1
       AND is_revoked = false
     RETURNING *`,
    [userId]
  );
  return result.rows; // all revoked sessions
};