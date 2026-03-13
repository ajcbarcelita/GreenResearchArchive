export const listDegreePrograms = async (db) => {
  const result = await db.query(
    `
      SELECT program_id, program_code, program_name, program_level
      FROM ref_degree_programs
      ORDER BY program_name ASC
    `,
  );

  return result.rows;
};

export const findDegreeProgramById = async (db, programId) => {
  const result = await db.query(
    `
      SELECT program_id
      FROM ref_degree_programs
      WHERE program_id = $1
      LIMIT 1
    `,
    [programId],
  );

  return result.rows[0] || null;
};

export const listDegreeProgramsForAdmin = async (db, { q, level } = {}) => {
  const params = [];
  const whereClauses = [];

  if (q) {
    params.push(`%${q}%`);
    whereClauses.push(
      `(p.program_code ILIKE $${params.length} OR p.program_name ILIKE $${params.length})`,
    );
  }

  if (level) {
    params.push(level);
    whereClauses.push(`p.program_level::text = $${params.length}`);
  }

  const where = whereClauses.length
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";

  const result = await db.query(
    `
      SELECT
        p.program_id,
        p.program_code,
        p.program_name,
        p.program_level,
        COALESCE(u.user_count, 0)::int AS user_count,
        COALESCE(g.group_count, 0)::int AS group_count
      FROM ref_degree_programs p
      LEFT JOIN (
        SELECT program_id, COUNT(*)::int AS user_count
        FROM users
        GROUP BY program_id
      ) u ON u.program_id = p.program_id
      LEFT JOIN (
        SELECT program_id, COUNT(*)::int AS group_count
        FROM capstone_groups
        GROUP BY program_id
      ) g ON g.program_id = p.program_id
      ${where}
      ORDER BY p.program_name ASC
    `,
    params,
  );

  return result.rows;
};

export const findDegreeProgramByCode = async (
  db,
  { code, excludeProgramId = null },
) => {
  const params = [code];
  let where = "LOWER(program_code) = LOWER($1)";

  if (excludeProgramId) {
    params.push(excludeProgramId);
    where += ` AND program_id <> $${params.length}`;
  }

  const result = await db.query(
    `
      SELECT program_id, program_code
      FROM ref_degree_programs
      WHERE ${where}
      LIMIT 1
    `,
    params,
  );

  return result.rows[0] || null;
};

export const insertDegreeProgram = async (
  db,
  { programCode, programName, programLevel },
) => {
  const result = await db.query(
    `
      INSERT INTO ref_degree_programs (program_code, program_name, program_level)
      VALUES ($1, $2, $3)
      RETURNING program_id, program_code, program_name, program_level
    `,
    [programCode, programName, programLevel],
  );

  return result.rows[0] || null;
};

export const updateDegreeProgramById = async (
  db,
  { programId, programCode, programName, programLevel },
) => {
  const result = await db.query(
    `
      UPDATE ref_degree_programs
      SET program_code = $1, program_name = $2, program_level = $3
      WHERE program_id = $4
      RETURNING program_id, program_code, program_name, program_level
    `,
    [programCode, programName, programLevel, programId],
  );

  return result.rows[0] || null;
};

export const deleteDegreeProgramById = async (db, programId) => {
  const result = await db.query(
    `
      DELETE FROM ref_degree_programs
      WHERE program_id = $1
      RETURNING program_id
    `,
    [programId],
  );

  return result.rows[0] || null;
};
