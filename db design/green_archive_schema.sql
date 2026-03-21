CREATE TYPE degree_level AS ENUM('Baccalaureate', 'Master''s', 'Doctorate');


CREATE TYPE submission_status AS ENUM
  ('Draft', 'Submitted', 'Under Review', 'Revision Requested', 'Approved', 'Archived')
;


CREATE TYPE file_type AS ENUM('Capstone Paper', 'Dataset');


CREATE TABLE ref_degree_programs(
  program_id serial NOT NULL,
  program_code varchar(10) NOT NULL,
  program_name varchar(100) NOT NULL,
  program_level degree_level NOT NULL,
  CONSTRAINT ref_degree_programs_pkey PRIMARY KEY(program_id)
);


CREATE UNIQUE INDEX program_code_idx ON ref_degree_programs(program_code);


ALTER TABLE ref_degree_programs
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;


COMMENT ON TABLE ref_degree_programs IS
  'Reference list of all degree programs in CCS.'
;


CREATE TABLE users(
  user_id serial NOT NULL,
  google_id varchar(255),
  email varchar(255) NOT NULL,
  university_id varchar(8) NOT NULL,
  fname varchar(100) NOT NULL,
  lname varchar(100) NOT NULL,
  mname varchar(100),
  program_id integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login timestamp with time zone,
  role_id integer NOT NULL,
  CONSTRAINT users_pkey PRIMARY KEY(user_id)
);


CREATE UNIQUE INDEX google_id_idx ON users(google_id);


CREATE UNIQUE INDEX email_idx ON users(email);


CREATE UNIQUE INDEX uni_id_idx ON users(university_id);


CREATE INDEX user_program_idx ON users(program_id);


CREATE INDEX user_role_idx ON users(role_id);


CREATE TABLE ref_roles(
role_id serial NOT NULL, role_name varchar(15) NOT NULL,
  CONSTRAINT ref_roles_pkey PRIMARY KEY(role_id)
);


CREATE UNIQUE INDEX ref_roles_role_name_idx ON ref_roles(role_name);


CREATE TABLE capstone_groups(
  group_id serial NOT NULL,
  group_name varchar(20) NOT NULL,
  program_id integer NOT NULL,
  group_adviser integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT capstone_groups_pkey PRIMARY KEY(group_id)
);


CREATE INDEX group_adviser_idx ON capstone_groups(group_adviser);


CREATE TABLE group_members(
group_id integer NOT NULL, student_id integer NOT NULL,
  CONSTRAINT group_members_pkey PRIMARY KEY(student_id, group_id)
);


CREATE INDEX group_members_group_id_idx ON group_members(group_id);


CREATE TABLE submissions(
  submission_id bigserial NOT NULL,
  task_id integer NOT NULL,
  group_id integer NOT NULL,
  title text NOT NULL,
  abstract text NOT NULL,
  summary text,
  keywords text[] NOT NULL,
  version_no integer NOT NULL DEFAULT 1,
  status submission_status NOT NULL DEFAULT 'Draft',
  is_locked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at timestamp with time zone,
  archived_at timestamp with time zone,
  CONSTRAINT submissions_pkey PRIMARY KEY(submission_id)
);


CREATE INDEX submissions_status_archived_at_idx ON submissions
  (status, archived_at DESC)
;


CREATE INDEX submissions_group_id_idx ON submissions(group_id);


CREATE UNIQUE INDEX submissions_group_task_version_unique_idx ON submissions
  (group_id, task_id, version_no)
;


CREATE INDEX submissions_keywords_idx ON submissions USING GIN(keywords);


CREATE TABLE submission_files(
  file_id serial NOT NULL,
  submission_id bigint NOT NULL,
  file_name text NOT NULL,
  s3_key text NOT NULL,
  file_type file_type NOT NULL,
  file_size bigint NOT NULL,
  uploaded_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version_no integer NOT NULL DEFAULT 1,
  CONSTRAINT submission_files_pkey PRIMARY KEY(file_id)
);


CREATE INDEX submission_files_submission_id_idx ON submission_files
  (submission_id)
;


CREATE TABLE submission_audit_logs(
  log_id serial NOT NULL,
  submission_id bigint NOT NULL,
  changed_by integer NOT NULL,
  old_status submission_status,
  new_status submission_status,
  remarks text,
  changed_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT submission_audit_logs_pkey PRIMARY KEY(log_id)
);


CREATE INDEX submission_audit_logs_submission_id_changed_at_idx ON
  submission_audit_logs(submission_id, changed_at DESC)
;


CREATE TABLE tasks(
  task_id serial NOT NULL,
  task_name varchar(100) NOT NULL,
  description text,
  due_date timestamp with time zone,
  is_locked boolean NOT NULL DEFAULT false,
  auto_lock_after_due_date boolean NOT NULL DEFAULT false,
  term_id integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT tasks_pkey PRIMARY KEY(task_id)
);


CREATE TABLE academic_terms(
  term_id serial NOT NULL,
  academic_year varchar(9) NOT NULL,
  term_no integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  CONSTRAINT academic_terms_pkey PRIMARY KEY(term_id)
);


CREATE UNIQUE INDEX unique_term_and_sy ON academic_terms(academic_year, term_id);


CREATE TABLE user_sessions(
  session_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id integer NOT NULL,
  refresh_token_hash text NOT NULL,
  user_agent text,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at timestamp with time zone NOT NULL,
  is_revoked boolean NOT NULL DEFAULT false,
  CONSTRAINT user_sessions_pkey PRIMARY KEY(session_id)
);


CREATE TABLE ref_research_fields(
field_id serial NOT NULL, field_name varchar(50) NOT NULL,
  CONSTRAINT ref_research_fields_pkey PRIMARY KEY(field_id)
);


CREATE TABLE paper_fields(
submission_id bigint NOT NULL, field_id integer NOT NULL,
  CONSTRAINT paper_fields_pkey PRIMARY KEY(submission_id, field_id)
);


ALTER TABLE users
  ADD CONSTRAINT user_degree
    FOREIGN KEY (program_id) REFERENCES ref_degree_programs (program_id)
      ON DELETE Restrict ON UPDATE Restrict
;


ALTER TABLE users
  ADD CONSTRAINT users_role_id_fkey
    FOREIGN KEY (role_id) REFERENCES ref_roles (role_id) ON DELETE Restrict
      ON UPDATE Restrict
;


ALTER TABLE capstone_groups
  ADD CONSTRAINT capstone_groups_group_adviser_fkey
    FOREIGN KEY (group_adviser) REFERENCES users (user_id) ON DELETE Restrict
      ON UPDATE Restrict
;


ALTER TABLE group_members
  ADD CONSTRAINT group_members_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES users (user_id) ON DELETE Restrict
      ON UPDATE Restrict
;


ALTER TABLE group_members
  ADD CONSTRAINT group_members_group_id_fkey
    FOREIGN KEY (group_id) REFERENCES capstone_groups (group_id) ON DELETE Cascade
      ON UPDATE Restrict
;


ALTER TABLE capstone_groups
  ADD CONSTRAINT capstone_groups_program_id_fkey
    FOREIGN KEY (program_id) REFERENCES ref_degree_programs (program_id)
      ON DELETE Restrict ON UPDATE Restrict
;


ALTER TABLE submissions
  ADD CONSTRAINT submissions_group_id_fkey
    FOREIGN KEY (group_id) REFERENCES capstone_groups (group_id) ON DELETE Restrict
;


ALTER TABLE submission_files
  ADD CONSTRAINT submission_files_submission_id_fkey
    FOREIGN KEY (submission_id) REFERENCES submissions (submission_id)
      ON DELETE Cascade
;


ALTER TABLE submission_audit_logs
  ADD CONSTRAINT submission_audit_logs_submission_id_fkey
    FOREIGN KEY (submission_id) REFERENCES submissions (submission_id)
      ON DELETE Cascade
;


ALTER TABLE submission_audit_logs
  ADD CONSTRAINT submission_audit_logs_changed_by_fkey
    FOREIGN KEY (changed_by) REFERENCES users (user_id) ON DELETE Restrict
;


ALTER TABLE submissions
  ADD CONSTRAINT submissions_task_id_fkey
    FOREIGN KEY (task_id) REFERENCES tasks (task_id) ON DELETE Restrict
;


ALTER TABLE paper_fields
  ADD CONSTRAINT paper_fields_submission_id_fkey
    FOREIGN KEY (submission_id) REFERENCES submissions (submission_id)
;


ALTER TABLE paper_fields
  ADD CONSTRAINT paper_fields_field_id_fkey
    FOREIGN KEY (field_id) REFERENCES ref_research_fields (field_id)
;


ALTER TABLE tasks
  ADD CONSTRAINT tasks_term_id_fkey
    FOREIGN KEY (term_id) REFERENCES academic_terms (term_id)
;


ALTER TABLE user_sessions
  ADD CONSTRAINT user_sessions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE Cascade
;