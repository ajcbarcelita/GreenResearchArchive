export const listGroupMembers = async (db, groupId) => {
  const result = await db.query(
    `
      SELECT gm.group_id, gm.student_id,
             u.user_id, u.university_id, u.email, u.fname, u.lname, u.mname, u.program_id
      FROM group_members gm
      LEFT JOIN users u ON u.user_id = gm.student_id
      WHERE gm.group_id = $1
      ORDER BY u.lname ASC NULLS LAST, u.fname ASC
    `,
    [groupId],
  )

  return result.rows
}

export const addGroupMember = async (db, { groupId, studentId }) => {
  const result = await db.query(
    `
      INSERT INTO group_members (group_id, student_id)
      VALUES ($1, $2)
      RETURNING group_id, student_id
    `,
    [groupId, studentId],
  )

  return result.rows[0]
}

export const removeGroupMember = async (db, { groupId, studentId }) => {
  const result = await db.query(
    `
      DELETE FROM group_members
      WHERE group_id = $1 AND student_id = $2
      RETURNING group_id, student_id
    `,
    [groupId, studentId],
  )

  return result.rows[0] || null
}

export const findGroupsForStudent = async (db, studentId) => {
  const result = await db.query(
    `
      SELECT cg.group_id, cg.group_name, cg.program_id, cg.group_adviser, cg.is_active
      FROM group_members gm
      JOIN capstone_groups cg ON cg.group_id = gm.group_id
      WHERE gm.student_id = $1
    `,
    [studentId],
  )

  return result.rows
}

export const existsGroupMember = async (db, { groupId, studentId }) => {
  const result = await db.query(
    `
      SELECT 1 FROM group_members
      WHERE group_id = $1 AND student_id = $2
      LIMIT 1
    `,
    [groupId, studentId],
  )

  return result.rowCount > 0
}
