export const findRoleByNameExact = async (db, roleName) => {
  const result = await db.query(
    `
      SELECT role_id, role_name
      FROM ref_roles
      WHERE LOWER(role_name) = LOWER($1)
      LIMIT 1
    `,
    [roleName],
  )

  return result.rows[0] || null
}

export const findRoleByNameLike = async (db, roleName) => {
  const result = await db.query(
    `
      SELECT role_id, role_name
      FROM ref_roles
      WHERE LOWER(role_name) LIKE LOWER($1)
      ORDER BY role_id ASC
      LIMIT 1
    `,
    [`%${roleName}%`],
  )

  return result.rows[0] || null
}

export const createRole = async (db, roleName) => {
  const result = await db.query(
    `
      INSERT INTO ref_roles (role_name)
      VALUES ($1)
      RETURNING role_id, role_name
    `,
    [roleName],
  )

  return result.rows[0]
}

export const findRoleNameById = async (db, roleId) => {
  const result = await db.query(
    `
      SELECT role_name
      FROM ref_roles
      WHERE role_id = $1
      LIMIT 1
    `,
    [roleId],
  )

  return result.rows[0]?.role_name || null
}
