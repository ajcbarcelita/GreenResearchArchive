const ROLE_NAMES = {
  ADMIN: 'Admin',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
}

const EMAIL_PATTERNS = {
  STUDENT: /_/,
  FACULTY: /\./,
}

const toTitleCase = (value = '') => {
  if (!value) return ''
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const splitName = (profile = {}) => {
  const firstName = profile.givenName || profile.firstName || ''
  const lastName = profile.familyName || profile.lastName || ''

  if (firstName && lastName) {
    return {
      fname: toTitleCase(firstName),
      lname: toTitleCase(lastName),
      mname: null,
    }
  }

  const fullName = (profile.name || '').trim()
  if (!fullName) {
    return {
      fname: 'Unknown',
      lname: 'User',
      mname: null,
    }
  }

  const parts = fullName.split(/\s+/)
  if (parts.length === 1) {
    return {
      fname: toTitleCase(parts[0]),
      lname: 'User',
      mname: null,
    }
  }

  return {
    fname: toTitleCase(parts[0]),
    lname: toTitleCase(parts[parts.length - 1]),
    mname: parts.length > 2 ? toTitleCase(parts.slice(1, -1).join(' ')) : null,
  }
}

const parseEmailList = (value = '') =>
  value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)

const buildRbacConfig = () => ({
  adminWhitelist: parseEmailList(process.env.RBAC_ADMIN_EMAILS || ''),
  facultyWhitelist: parseEmailList(process.env.RBAC_FACULTY_EMAILS || ''),
  studentWhitelist: parseEmailList(process.env.RBAC_STUDENT_EMAILS || ''),
  blacklist: parseEmailList(process.env.RBAC_BLACKLIST_EMAILS || ''),
})

const resolveRoleFromEmail = (email) => {
  const normalizedEmail = email.toLowerCase()
  const localPart = normalizedEmail.split('@')[0] || ''
  const config = buildRbacConfig()

  if (config.adminWhitelist.includes(normalizedEmail)) {
    return ROLE_NAMES.ADMIN
  }

  if (config.facultyWhitelist.includes(normalizedEmail)) {
    return ROLE_NAMES.FACULTY
  }

  if (config.studentWhitelist.includes(normalizedEmail)) {
    return ROLE_NAMES.STUDENT
  }

  if (config.blacklist.includes(normalizedEmail)) {
    const error = new Error('Access denied. This email is blocked from sign in.')
    error.statusCode = 403
    throw error
  }

  if (EMAIL_PATTERNS.STUDENT.test(localPart)) {
    return ROLE_NAMES.STUDENT
  }

  if (EMAIL_PATTERNS.FACULTY.test(localPart)) {
    return ROLE_NAMES.FACULTY
  }

  return ROLE_NAMES.STUDENT
}

const resolveRoleIdByName = async (db, roleName) => {
  const exactRole = await db.query(
    `
      SELECT role_id, role_name
      FROM ref_roles
      WHERE LOWER(role_name) = LOWER($1)
      LIMIT 1
    `,
    [roleName],
  )

  if (exactRole.rowCount > 0) {
    return exactRole.rows[0]
  }

  const fuzzyRole = await db.query(
    `
      SELECT role_id, role_name
      FROM ref_roles
      WHERE LOWER(role_name) LIKE LOWER($1)
      ORDER BY role_id ASC
      LIMIT 1
    `,
    [`%${roleName}%`],
  )

  if (fuzzyRole.rowCount > 0) {
    return fuzzyRole.rows[0]
  }

  const createdRole = await db.query(
    `
      INSERT INTO ref_roles (role_name)
      VALUES ($1)
      RETURNING role_id, role_name
    `,
    [roleName],
  )

  return createdRole.rows[0]
}

export const findGoogleUser = async (db, profile) => {
  if (!db) {
    const error = new Error('Database client is not initialized')
    error.statusCode = 500
    throw error
  }

  const googleId = profile.id
  const email = (profile.email || '').toLowerCase().trim()

  if (!googleId || !email) {
    const error = new Error('Invalid Google profile payload')
    error.statusCode = 400
    throw error
  }

  const existingResult = await db.query(
    `
      SELECT user_id, email, university_id, fname, lname, mname, program_id, role_id, is_active, last_login
      FROM users
      WHERE google_id = $1 OR email = $2
      LIMIT 1
    `,
    [googleId, email],
  )

  if (existingResult.rowCount === 0) {
    return null
  }

  const existingUser = existingResult.rows[0]
  const role = await db.query(
    `
      SELECT role_name
      FROM ref_roles
      WHERE role_id = $1
      LIMIT 1
    `,
    [existingUser.role_id],
  )

  return {
    ...existingUser,
    role_name: role.rows[0]?.role_name || null,
  }
}

export const updateGoogleUserLogin = async (db, profile) => {
  if (!db) {
    const error = new Error('Database client is not initialized')
    error.statusCode = 500
    throw error
  }

  const googleId = profile.id
  const email = (profile.email || '').toLowerCase().trim()

  if (!googleId || !email) {
    const error = new Error('Invalid Google profile payload')
    error.statusCode = 400
    throw error
  }

  const existingUser = await findGoogleUser(db, profile)

  if (!existingUser) {
    return null
  }

  const { fname, lname, mname } = splitName(profile)
  const roleName = resolveRoleFromEmail(email)
  const role = await resolveRoleIdByName(db, roleName)

  const updated = await db.query(
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
    [googleId, email, fname, lname, mname, role.role_id, existingUser.user_id],
  )

  return {
    ...updated.rows[0],
    role_name: role.role_name,
  }
}

export const buildOnboardingProfile = (profile) => {
  const email = (profile?.email || '').toLowerCase().trim()
  if (!profile?.id || !email) {
    const error = new Error('Invalid Google profile payload')
    error.statusCode = 400
    throw error
  }

  return {
    googleId: profile.id,
    email,
    name: profile.name || null,
    givenName: profile.givenName || null,
    familyName: profile.familyName || null,
    roleName: resolveRoleFromEmail(email),
  }
}

export const createUserFromOnboarding = async (
  db,
  { googleId, email, firstName, lastName, middleName, programId, universityId },
) => {
  if (!db) {
    const error = new Error('Database client is not initialized')
    error.statusCode = 500
    throw error
  }

  const roleName = resolveRoleFromEmail(email)
  const role = await resolveRoleIdByName(db, roleName)

  const programExists = await db.query(
    `
      SELECT program_id
      FROM ref_degree_programs
      WHERE program_id = $1
      LIMIT 1
    `,
    [programId],
  )

  if (programExists.rowCount === 0) {
    const error = new Error('Selected degree program does not exist.')
    error.statusCode = 400
    throw error
  }

  const existingResult = await db.query(
    `
      SELECT user_id
      FROM users
      WHERE google_id = $1 OR email = $2
      LIMIT 1
    `,
    [googleId, email],
  )

  if (existingResult.rowCount > 0) {
    const error = new Error('Account already exists. Please sign in again.')
    error.statusCode = 409
    throw error
  }

  try {
    const inserted = await db.query(
      `
        INSERT INTO users (google_id, email, university_id, fname, lname, mname, program_id, role_id, last_login, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, true)
        RETURNING user_id, email, university_id, fname, lname, mname, program_id, role_id, is_active, created_at, last_login
      `,
      [googleId, email, universityId, firstName, lastName, middleName, programId, role.role_id],
    )

    return {
      ...inserted.rows[0],
      role_name: role.role_name,
    }
  } catch (error) {
    if (error?.code === '23505' && error?.constraint === 'uni_id_idx') {
      const duplicateError = new Error('University ID is already in use.')
      duplicateError.statusCode = 409
      throw duplicateError
    }

    if (error?.code === '23505') {
      const duplicateError = new Error('A unique value already exists for this account.')
      duplicateError.statusCode = 409
      throw duplicateError
    }
    throw error
  }
}

export const getDegreePrograms = async (db) => {
  if (!db) {
    const error = new Error('Database client is not initialized')
    error.statusCode = 500
    throw error
  }

  const result = await db.query(
    `
      SELECT program_id, program_code, program_name, program_level
      FROM ref_degree_programs
      ORDER BY program_name ASC
    `,
  )

  return result.rows
}

export const completeFirstLoginProfile = async (
  db,
  { userId, firstName, lastName, middleName, programId, universityId },
) => {
  if (!db) {
    const error = new Error('Database client is not initialized')
    error.statusCode = 500
    throw error
  }

  const programExists = await db.query(
    `
      SELECT program_id
      FROM ref_degree_programs
      WHERE program_id = $1
      LIMIT 1
    `,
    [programId],
  )

  if (programExists.rowCount === 0) {
    const error = new Error('Selected degree program does not exist.')
    error.statusCode = 400
    throw error
  }

  let updatedResult
  try {
    updatedResult = await db.query(
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
    )
  } catch (error) {
    if (error?.code === '23505' && error?.constraint === 'uni_id_idx') {
      const duplicateError = new Error('University ID is already in use.')
      duplicateError.statusCode = 409
      throw duplicateError
    }

    if (error?.code === '23505') {
      const duplicateError = new Error('A unique value already exists for this account.')
      duplicateError.statusCode = 409
      throw duplicateError
    }

    throw error
  }

  if (updatedResult.rowCount > 0) {
    const role = await db.query(
      `
        SELECT role_name
        FROM ref_roles
        WHERE role_id = $1
        LIMIT 1
      `,
      [updatedResult.rows[0].role_id],
    )

    return {
      ...updatedResult.rows[0],
      role_name: role.rows[0]?.role_name || null,
    }
  }

  const existingUser = await db.query(
    `
      SELECT user_id, last_login
      FROM users
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId],
  )

  if (existingUser.rowCount === 0) {
    const error = new Error('User was not found.')
    error.statusCode = 404
    throw error
  }

  const error = new Error('Profile is already completed for this account.')
  error.statusCode = 409
  throw error
}
