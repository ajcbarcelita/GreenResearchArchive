--------------------------------------------------
-- REFERENCE TABLES
--------------------------------------------------
TRUNCATE TABLE ref_degree_programs CASCADE;
TRUNCATE TABLE ref_roles CASCADE;

INSERT INTO ref_degree_programs (program_id, program_code, program_name, program_level) VALUES
(1, 'BSIT', 'Bachelor of Science in Information Technology', 'Baccalaureate'),
(2, 'BSIS', 'Bachelor of Science in Information Systems', 'Baccalaureate'),
(3, 'DIT', 'Doctor in Information Technology', 'Doctorate'),
(4, 'MIT', 'Master in Information Technology', 'Master''s'),
(5, 'MSIT', 'Master of Science in Information Technology', 'Master''s');

INSERT INTO ref_roles (role_id, role_name) VALUES
(1, 'Student'),
(2, 'Faculty'),
(3, 'Coordinator'),
(4, 'Admin');


--------------------------------------------------
-- USERS
--------------------------------------------------
TRUNCATE TABLE users CASCADE;

INSERT INTO users
(user_id, google_id, email, university_id, fname, lname, mname, program_id, role_id)
VALUES
-- advisers (Faculty role)
(1, 'gid1001', 'marivic.tangkeko@dlsu.edu.ph', '11900001', 'Marivic', 'Tangkeko', 'S', 1, 2),
(2, 'gid1002', 'raphael.gonda@dlsu.edu.ph', '11900002', 'Raphael', 'Gonda', 'S', 1, 2),

-- students (Student role)
(3, 'gid2001', 'juan.delacruz@dlsu.edu.ph', '12100001', 'Juan', 'Dela Cruz', 'M', 1, 1),
(4, 'gid2002', 'josh_cariaga@dlsu.edu.ph', '12306592', 'Maria', 'Santos', 'L', 2, 1),
(5, 'gid2003', 'angela.tan@dlsu.edu.ph', '12100003', 'Angela', 'Tan', 'C', 1, 1),
(6, 'gid2004', 'michael.chua@dlsu.edu.ph', '12100004', 'Michael', 'Chua', 'D', 1, 1),
(7, 'gid2005', 'david.uy@dlsu.edu.ph', '12100005', 'David', 'Uy', 'E', 2, 1),
(8, 'gid2006', 'jasmine.sy@dlsu.edu.ph', '12100006', 'Jasmine', 'Sy', 'F', 1, 1);


--------------------------------------------------
-- CAPSTONE GROUPS
--------------------------------------------------
TRUNCATE TABLE capstone_groups CASCADE;

INSERT INTO capstone_groups
(group_id, group_name, program_id, group_adviser)
VALUES
(1, 'AI Informatics', 1, 1),
(2, 'Smart Traffic', 1, 2),
(3, 'Mobile Agentic', 1, 1);


--------------------------------------------------
-- GROUP MEMBERS
--------------------------------------------------
TRUNCATE TABLE group_members CASCADE;

INSERT INTO group_members (group_id, student_id)
VALUES
-- group 1
(1, 3),
(1, 4),
(1, 5),

-- group 2
(2, 6),
(2, 7),

-- group 3
(3, 8);


--------------------------------------------------
-- SUBMISSIONS
--------------------------------------------------
TRUNCATE TABLE submissions CASCADE;

INSERT INTO submissions
(submission_id, group_id, title, abstract, keywords, status, submitted_at)
VALUES
(
1,
1,
'AI Powered Healthcare Risk Prediction',
'Machine learning system predicting patient health risks using hospital data.',
ARRAY['AI', 'Healthcare', 'Machine Learning', 'Prediction'],
'Approved',
NOW()
),
(
2,
2,
'Real-Time Traffic Monitoring Using Computer Vision',
'AI powered traffic congestion detection using CCTV feeds.',
ARRAY['Computer Vision', 'Traffic', 'AI', 'Smart City'],
'Under Review',
NOW()
),
(
3,
3,
'Blockchain Based Secure Voting Platform',
'Decentralized voting platform for secure university elections.',
ARRAY['Blockchain', 'Voting', 'Security', 'Decentralized'],
'Submitted',
NOW()
);


--------------------------------------------------
-- SUBMISSION FILES
--------------------------------------------------
TRUNCATE TABLE submission_files CASCADE;

INSERT INTO submission_files
(file_id, submission_id, file_name, s3_key, file_type, file_size)
VALUES
(
1,
1,
'AI_Healthcare_Capstone.pdf',
'capstones/ai_healthcare_v1.pdf',
'Capstone Paper',
5242880
),
(
2,
2,
'Traffic_AI_System.pdf',
'capstones/traffic_ai_v1.pdf',
'Capstone Paper',
4875520
),
(
3,
3,
'Blockchain_Voting_System.pdf',
'capstones/blockchain_voting_v1.pdf',
'Capstone Paper',
5022331
);


--------------------------------------------------
-- AUDIT LOGS
--------------------------------------------------
TRUNCATE TABLE submission_audit_logs CASCADE;

INSERT INTO submission_audit_logs
(log_id, submission_id, changed_by, old_status, new_status, remarks)
VALUES
(
1,
1,
1,
'Under Review',
'Approved',
'Final panel approval'
),
(
2,
2,
2,
'Submitted',
'Under Review',
'Forwarded to panel'
),
(
3,
3,
1,
'Draft',
'Submitted',
'Initial submission by group'
);