export const findCapstoneGroupById = async (db, groupId) => {
  const result = await db.query(
    `
      SELECT group_id, group_name, program_id, group_adviser, is_active, created_at
      FROM capstone_groups
      WHERE group_id = $1
      LIMIT 1
    `,
    [groupId],
  )

  return result.rows[0] || null
}

export const listCapstoneGroups = async (db, { programId } = {}) => {
  const params = []
  let where = ''
  if (programId) {
    params.push(programId)
    where = `WHERE program_id = $${params.length}`
  }

  const result = await db.query(
    `
      SELECT group_id, group_name, program_id, group_adviser, is_active, created_at
      FROM capstone_groups
      ${where}
      ORDER BY group_name ASC
    `,
    params,
  )

  return result.rows
}

export const insertCapstoneGroup = async (db, { groupName, programId, groupAdviser }) => {
  const result = await db.query(
    `
      INSERT INTO capstone_groups (group_name, program_id, group_adviser, is_active, created_at)
      VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
      RETURNING group_id, group_name, program_id, group_adviser, is_active, created_at
    `,
    [groupName, programId, groupAdviser],
  )

  return result.rows[0]
}

export const updateCapstoneGroup = async (db, { groupId, groupName, programId, groupAdviser, isActive }) => {
  const result = await db.query(
    `
      UPDATE capstone_groups
      SET group_name = $1, program_id = $2, group_adviser = $3, is_active = $4
      WHERE group_id = $5
      RETURNING group_id, group_name, program_id, group_adviser, is_active, created_at
    `,
    [groupName, programId, groupAdviser, isActive, groupId],
  )

  return result.rows[0] || null
}
