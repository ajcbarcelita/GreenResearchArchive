-- Deletes all submissions and dependent records.
-- Keeps users, groups, tasks, and terms intact.

BEGIN;

-- paper_fields has no ON DELETE CASCADE, so remove it first.
DELETE FROM paper_fields;

-- These tables reference submissions and are safe to clear explicitly.
DELETE FROM submission_audit_logs;
DELETE FROM submission_files;

-- Finally remove all submissions.
DELETE FROM submissions;

-- Reset identity sequences for a clean reseed.
ALTER SEQUENCE IF EXISTS submissions_submission_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS submission_files_file_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS submission_audit_logs_log_id_seq RESTART WITH 1;

COMMIT;
