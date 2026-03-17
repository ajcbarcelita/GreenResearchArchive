export const listSubmissionFilesBySubmissionId = async (db, submissionId) => {
  const result = await db.query(
    `
      SELECT file_id, submission_id, file_name, s3_key, file_type, file_size, uploaded_at, version_no
      FROM submission_files
      WHERE submission_id = $1
      ORDER BY uploaded_at DESC, file_id DESC
    `,
    [submissionId],
  );

  return result.rows;
};

export const findSubmissionFileById = async (db, fileId) => {
  const result = await db.query(
    `
      SELECT file_id, submission_id, file_name, s3_key, file_type, file_size, uploaded_at, version_no
      FROM submission_files
      WHERE file_id = $1
      LIMIT 1
    `,
    [fileId],
  );

  return result.rows[0] || null;
};

export const insertSubmissionFile = async (
  db,
  { submissionId, fileName, s3Key, fileType, fileSize, versionNo },
) => {
  const result = await db.query(
    `
      INSERT INTO submission_files (submission_id, file_name, s3_key, file_type, file_size, version_no)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING file_id, submission_id, file_name, s3_key, file_type, file_size, uploaded_at, version_no
    `,
    [submissionId, fileName, s3Key, fileType, fileSize, versionNo],
  );

  return result.rows[0] || null;
};

export const deleteSubmissionFileById = async (db, fileId) => {
  const result = await db.query(
    `
      DELETE FROM submission_files
      WHERE file_id = $1
      RETURNING file_id, submission_id, file_name, s3_key
    `,
    [fileId],
  );

  return result.rows[0] || null;
};

export const getSubmissionFileStatsBySubmissionId = async (db, submissionId) => {
  const result = await db.query(
    `
      SELECT
        COUNT(*) FILTER (WHERE file_type = 'Capstone Paper')::int AS capstone_paper_count,
        COUNT(*) FILTER (WHERE file_type = 'Dataset')::int AS dataset_count,
        MAX(uploaded_at) AS latest_upload_at
      FROM submission_files
      WHERE submission_id = $1
    `,
    [submissionId],
  );

  return result.rows[0] || {
    capstone_paper_count: 0,
    dataset_count: 0,
    latest_upload_at: null,
  };
};
