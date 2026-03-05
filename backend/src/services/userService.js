const DLSU_EMAIL_DOMAIN = '@dlsu.edu.ph'

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

const generateUniversityId = ({ email, googleId }) => {
  const safeEmail = (email || '').toLowerCase()
  const localPart = safeEmail.endsWith(DLSU_EMAIL_DOMAIN)
    ? safeEmail.replace(DLSU_EMAIL_DOMAIN, '')
    : safeEmail.split('@')[0]

  const cleanedLocal = localPart.replace(/[^a-z0-9]/gi, '').toUpperCase()
  const fallbackSeed = (googleId || '').replace(/\D/g, '') || String(Date.now())

  if (cleanedLocal.length === 8) return cleanedLocal
  if (cleanedLocal.length > 8) return cleanedLocal.slice(-8)

  return `${cleanedLocal}${fallbackSeed}`.slice(0, 8).padEnd(8, '0')
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

  const error = new Error(`Role '${roleName}' was not found in ref_roles.`)
  error.statusCode = 500
  throw error
}

export const upsertGoogleUser = async (db, profile) => {
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

  const { fname, lname, mname } = splitName(profile)
  const universityId = generateUniversityId({ email, googleId })
  const roleName = resolveRoleFromEmail(email)
  const role = await resolveRoleIdByName(db, roleName)

  const existingResult = await db.query(
    `
      SELECT user_id, role_id, program_id
      FROM users
      WHERE google_id = $1 OR email = $2
      LIMIT 1
    `,
    [googleId, email],
  )

  if (existingResult.rowCount > 0) {
    const existingUser = existingResult.rows[0]
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

  const inserted = await db.query(
    `
      INSERT INTO users (google_id, email, university_id, fname, lname, mname, role_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING user_id, email, university_id, fname, lname, mname, program_id, role_id, is_active, created_at, last_login
    `,
    [googleId, email, universityId, fname, lname, mname, role.role_id],
  )

  return {
    ...inserted.rows[0],
    role_name: role.role_name,
  }
}
