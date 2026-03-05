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
      INSERT INTO users (google_id, email, university_id, fname, lname, mname, program_id, role_id, last_login, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, true)
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
