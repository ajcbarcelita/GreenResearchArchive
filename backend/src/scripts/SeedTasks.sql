--------------------------------------------------
-- SEED: Academic Terms & Tasks
-- Run this BEFORE Dataset.sql (or standalone) to
-- populate the academic_terms and tasks tables.
-- Submissions have a NOT NULL FK to tasks.task_id,
-- so at least one term + task must exist first.
--------------------------------------------------

-- 1. ACADEMIC TERMS
--    academic_year format: YYYY-YYYY  (9 chars)
--    term_no: 1 = First Semester, 2 = Second Semester

TRUNCATE TABLE tasks CASCADE;
TRUNCATE TABLE academic_terms CASCADE;

INSERT INTO academic_terms (term_id, academic_year, term_no, start_date, end_date)
VALUES
  (1, '2024-2025', 1, '2024-08-01', '2024-12-20'),
  (2, '2024-2025', 2, '2025-01-06', '2025-05-31'),
  (3, '2025-2026', 1, '2025-08-04', '2025-12-19'),
  (4, '2025-2026', 2, '2026-01-05', '2026-05-29');


-- 2. TASKS
--    Each task belongs to a term and represents a
--    submission milestone students must complete.

INSERT INTO tasks (task_id, task_name, description, due_date, term_id)
VALUES
  -- AY 2024-2025 Term 1
  (1, 'Proposal Submission',
      'Submit the initial capstone project proposal including background, objectives, and scope.',
      '2024-10-15 23:59:00+08', 1),
  (2, 'Progress Report',
      'Submit a progress report detailing work completed to date and updated project plan.',
      '2024-11-29 23:59:00+08', 1),

  -- AY 2024-2025 Term 2
  (3, 'Draft Manuscript',
      'Submit the full draft manuscript for adviser review.',
      '2025-03-28 23:59:00+08', 2),
  (4, 'Final Manuscript',
      'Submit the final approved capstone manuscript.',
      '2025-05-09 23:59:00+08', 2),

  -- AY 2025-2026 Term 1
  (5, 'Proposal Submission',
      'Submit the initial capstone project proposal including background, objectives, and scope.',
      '2025-10-17 23:59:00+08', 3),
  (6, 'Progress Report',
      'Submit a progress report detailing work completed to date and updated project plan.',
      '2025-11-28 23:59:00+08', 3),

  -- AY 2025-2026 Term 2  (current term as of March 2026)
  (7, 'Draft Manuscript',
      'Submit the full draft manuscript for adviser review.',
      '2026-03-27 23:59:00+08', 4),
  (8, 'Final Manuscript',
      'Submit the final approved capstone manuscript.',
      '2026-05-08 23:59:00+08', 4);
