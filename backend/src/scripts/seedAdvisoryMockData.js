import { initDB, closeDB } from "../db/db.js";
import logger from "../utils/logger.js";

const upsertUser = async (
  db,
  { googleId, email, universityId, fname, lname, mname, roleName, programCode = null },
) => {
  const result = await db.query(
    `
      INSERT INTO users (google_id, email, university_id, fname, lname, mname, role_id, program_id, is_active)
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        (SELECT role_id FROM ref_roles WHERE role_name = $7 LIMIT 1),
        (SELECT program_id FROM ref_degree_programs WHERE program_code = $8 LIMIT 1),
        true
      )
      ON CONFLICT (email)
      DO UPDATE SET
        fname = EXCLUDED.fname,
        lname = EXCLUDED.lname,
        mname = EXCLUDED.mname,
        is_active = true
      RETURNING user_id
    `,
    [googleId, email, universityId, fname, lname, mname, roleName, programCode],
  );

  return result.rows[0]?.user_id;
};

const upsertGroup = async (db, { groupName, programCode, adviserId }) => {
  const result = await db.query(
    `
      INSERT INTO capstone_groups (group_name, program_id, group_adviser, is_active)
      VALUES (
        $1,
        (SELECT program_id FROM ref_degree_programs WHERE program_code = $2 LIMIT 1),
        $3,
        true
      )
      ON CONFLICT DO NOTHING
      RETURNING group_id
    `,
    [groupName, programCode, adviserId],
  );

  if (result.rows[0]?.group_id) return result.rows[0].group_id;

  const existing = await db.query(
    `
      SELECT group_id
      FROM capstone_groups
      WHERE group_name = $1 AND group_adviser = $2
      LIMIT 1
    `,
    [groupName, adviserId],
  );

  return existing.rows[0]?.group_id;
};

const upsertGroupMember = async (db, { groupId, studentId }) => {
  await db.query(
    `
      INSERT INTO group_members (group_id, student_id)
      VALUES ($1, $2)
      ON CONFLICT (student_id, group_id) DO NOTHING
    `,
    [groupId, studentId],
  );
};

const insertSubmission = async (db, { groupId, title, abstract, keywords, status, versionNo, isLocked }) => {
  await db.query(
    `
      INSERT INTO submissions (group_id, title, abstract, keywords, status, version_no, is_locked, submitted_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    `,
    [groupId, title, abstract, keywords, status, versionNo, isLocked],
  );
};

const seed = async () => {
  let db;
  try {
    db = await initDB();
    await db.query("BEGIN");

    const facultyA = await upsertUser(db, {
      googleId: "mock-faculty-a",
      email: "faculty.advisory.a@dlsu.edu.ph",
      universityId: "88110001",
      fname: "Liza",
      lname: "Navarro",
      mname: "C",
      roleName: "Faculty",
      programCode: "BSIT",
    });

    const facultyB = await upsertUser(db, {
      googleId: "mock-faculty-b",
      email: "faculty.advisory.b@dlsu.edu.ph",
      universityId: "88110002",
      fname: "Marco",
      lname: "Santos",
      mname: "D",
      roleName: "Faculty",
      programCode: "BSIS",
    });

    const coordinator = await upsertUser(db, {
      googleId: "mock-coordinator-a",
      email: "coordinator.advisory.a@dlsu.edu.ph",
      universityId: "88110003",
      fname: "Irene",
      lname: "De Leon",
      mname: "F",
      roleName: "Coordinator",
      programCode: "BSIT",
    });

    const studentA = await upsertUser(db, {
      googleId: "mock-student-a",
      email: "student.advisory.a@dlsu.edu.ph",
      universityId: "88120001",
      fname: "Aimee",
      lname: "Reyes",
      mname: "G",
      roleName: "Student",
      programCode: "BSIT",
    });

    const studentB = await upsertUser(db, {
      googleId: "mock-student-b",
      email: "student.advisory.b@dlsu.edu.ph",
      universityId: "88120002",
      fname: "Noel",
      lname: "Garcia",
      mname: "H",
      roleName: "Student",
      programCode: "BSIS",
    });

    const studentC = await upsertUser(db, {
      googleId: "mock-student-c",
      email: "student.advisory.c@dlsu.edu.ph",
      universityId: "88120003",
      fname: "Paula",
      lname: "Lim",
      mname: "I",
      roleName: "Student",
      programCode: "BSIT",
    });

    const groupA = await upsertGroup(db, {
      groupName: "Mock Advisory Alpha",
      programCode: "BSIT",
      adviserId: facultyA,
    });

    const groupB = await upsertGroup(db, {
      groupName: "Mock Advisory Beta",
      programCode: "BSIS",
      adviserId: facultyB,
    });

    const groupC = await upsertGroup(db, {
      groupName: "Mock Advisory Gamma",
      programCode: "BSIT",
      adviserId: coordinator,
    });

    await upsertGroupMember(db, { groupId: groupA, studentId: studentA });
    await upsertGroupMember(db, { groupId: groupA, studentId: studentC });
    await upsertGroupMember(db, { groupId: groupB, studentId: studentB });

    await insertSubmission(db, {
      groupId: groupA,
      title: "Mock Advisory Alpha Submission",
      abstract: "Mock advisory submission for dashboard and filtering tests.",
      keywords: ["Mock", "Advisory", "Alpha"],
      status: "Under Review",
      versionNo: 2,
      isLocked: false,
    });

    await insertSubmission(db, {
      groupId: groupB,
      title: "Mock Advisory Beta Submission",
      abstract: "Mock submission in revision requested status.",
      keywords: ["Mock", "Advisory", "Beta"],
      status: "Revision Requested",
      versionNo: 1,
      isLocked: true,
    });

    await db.query("COMMIT");
    logger.info("[SUCCESS] Advisory mock data seeded.");
  } catch (error) {
    if (db) {
      await db.query("ROLLBACK").catch(() => {});
    }
    logger.error("[ERROR] Advisory mock seed failed:");
    logger.error(error);
    process.exit(1);
  } finally {
    await closeDB();
    process.exit(0);
  }
};

seed();
