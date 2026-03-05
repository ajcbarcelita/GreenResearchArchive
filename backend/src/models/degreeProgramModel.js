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
