/**
 * Create a new session record
 * @param {object} db - Database connection client
 * @param {number} userId - User ID
 * @param {string} refreshTokenHash - Hashed refresh token
 * @param {string} userAgent - User agent string from request headers
 * @param {string} ipAddress - IP address of the client
 * @param {Date} expiresAt - Expiration timestamp for the refresh token
 * @returns {object} Created session record with session_id
 */
export const createSession = async (
  db,
  userId,
  refreshTokenHash,
  userAgent,
  ipAddress,
  expiresAt,
) => {
  const result = await db.query(
    `
      INSERT INTO user_sessions (user_id, refresh_token_hash, user_agent, ip_address, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING session_id, user_id, created_at, expires_at, is_revoked
    `,
    [userId, refreshTokenHash, userAgent, ipAddress, expiresAt],
  );

  return result.rows[0];
};

/**
 * Get a session by ID
 * @param {object} db - Database connection client
 * @param {string} sessionId - Session UUID
 * @returns {object|null} Session record or null if not found
 */
export const getSessionById = async (db, sessionId) => {
  const result = await db.query(
    `
      SELECT session_id, user_id, refresh_token_hash, user_agent, ip_address,
             created_at, expires_at, is_revoked
      FROM user_sessions
      WHERE session_id = $1
    `,
    [sessionId],
  );

  return result.rows[0] || null;
};

/**
 * Get active (non-revoked, non-expired) session by ID
 * @param {object} db - Database connection client
 * @param {string} sessionId - Session UUID
 * @returns {object|null} Active session record or null
 */
export const getActiveSessionById = async (db, sessionId) => {
  const result = await db.query(
    `
      SELECT session_id, user_id, refresh_token_hash, user_agent, ip_address,
             created_at, expires_at, is_revoked
      FROM user_sessions
      WHERE session_id = $1
        AND is_revoked = false
        AND expires_at > NOW()
    `,
    [sessionId],
  );

  return result.rows[0] || null;
};

/**
 * Get all active sessions for a user
 * @param {object} db - Database connection client
 * @param {number} userId - User ID
 * @returns {array} Array of active session records
 */
export const getActiveSessionsByUserId = async (db, userId) => {
  const result = await db.query(
    `
      SELECT session_id, user_id, user_agent, ip_address, created_at, expires_at, is_revoked
      FROM user_sessions
      WHERE user_id = $1
        AND is_revoked = false
        AND expires_at > NOW()
      ORDER BY created_at DESC
    `,
    [userId],
  );

  return result.rows;
};

/**
 * Revoke a single session
 * @param {object} db - Database connection client
 * @param {string} sessionId - Session UUID
 * @returns {boolean} True if revocation was successful
 */
export const revokeSession = async (db, sessionId) => {
  const result = await db.query(
    `
      UPDATE user_sessions
      SET is_revoked = true
      WHERE session_id = $1
      RETURNING session_id
    `,
    [sessionId],
  );

  return result.rowCount > 0;
};

/**
 * Revoke all sessions for a user
 * @param {object} db - Database connection client
 * @param {number} userId - User ID
 * @returns {number} Count of revoked sessions
 */
export const revokeAllUserSessions = async (db, userId) => {
  const result = await db.query(
    `
      UPDATE user_sessions
      SET is_revoked = true
      WHERE user_id = $1 AND is_revoked = false
      RETURNING session_id
    `,
    [userId],
  );

  return result.rowCount;
};

/**
 * Validate that a session exists, is not revoked, and has not expired
 * @param {object} db - Database connection client
 * @param {string} sessionId - Session UUID
 * @returns {boolean} True if session is valid
 */
export const isSessionValid = async (db, sessionId) => {
  const session = await getActiveSessionById(db, sessionId);
  return session !== null;
};

/**
 * Clean up expired sessions (manual maintenance)
 * @param {object} db - Database connection client
 * @returns {number} Count of deleted sessions
 */
export const cleanupExpiredSessions = async (db) => {
  const result = await db.query(
    `
      DELETE FROM user_sessions
      WHERE expires_at < NOW()
    `,
  );

  return result.rowCount;
};
