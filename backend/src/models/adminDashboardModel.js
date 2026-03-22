// Will hold the SQL queries for the admin dashboard
export const getSystemStats = async (db) => {
  // 1. Active sessions
  const sessionRes = await db.query(`
    SELECT COUNT(*) AS active_sessions
    FROM user_sessions
    WHERE is_revoked = false AND expires_at > CURRENT_TIMESTAMP
  `);

  // 2. New users in last 30 days
  const newUsersRes = await db.query(`
    SELECT COUNT(*) as new_users
    FROM users
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `);

  // 3. Storage and files (From submission_files)
  const storageRes = await db.query(`
    SELECT 
      COUNT(file_id) as total_files, 
      COALESCE(SUM(file_size), 0) as total_bytes
    FROM submission_files
  `);

  return {
    activeSessions: parseInt(sessionRes.rows[0].active_sessions, 10),
    newUsers30d: parseInt(newUsersRes.rows[0].new_users, 10),
    totalFiles: parseInt(storageRes.rows[0].total_files, 10),
    totalBytes: parseInt(storageRes.rows[0].total_bytes, 10),
  };
};

// We dont include Admin
export const getRoleDistribution = async (db) => {
  const result = await db.query(`
    SELECT
      r.role_name as role,
      COUNT(u.user_id) as count
    FROM ref_roles r
    LEFT JOIN users u ON r.role_id = u.role_id
    WHERE LOWER(r.role_name) != 'admin'
    GROUP BY r.role_id, r.role_name
    ORDER BY count DESC
  `);

  return result.rows.map((row) => ({
    role: row.role,
    count: parseInt(row.count, 10),
  }));
};

export const getActiveSessionsList = async (db) => {
  const result = await db.query(`
    SELECT
      s.session_id,
      u.fname,
      u.lname,
      u.email,
      s.ip_address,
      s.user_agent,
      s.created_at
    FROM user_sessions s
    JOIN users u ON s.user_id = u.user_id
    WHERE s.is_revoked = false AND s.expires_at > CURRENT_TIMESTAMP
    ORDER BY s.created_at DESC
    LIMIT 50
  `);

  return result.rows;
};
