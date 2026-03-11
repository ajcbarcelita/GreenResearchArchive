TRUNCATE TABLE ref_degree_programs RESTART IDENTITY CASCADE;
TRUNCATE TABLE ref_roles RESTART IDENTITY CASCADE;

INSERT INTO ref_roles (role_name) VALUES 
('Student'), 
('Faculty'), 
('Coordinator'), 
('Admin');

INSERT INTO ref_degree_programs (program_code, program_name, program_level) VALUES
('BSIT', 'Bachelor of Science in Information Technology', 'Baccalaureate'),
('BSIS', 'Bachelor of Science in Information Systems', 'Baccalaureate'),
('DIT', 'Doctor in Information Technology', 'Doctorate'),
('MIT', 'Master in Information Technology', 'Master''s'),
('MSIT', 'Master of Science in Information Technology', 'Master''s');

TRUNCATE TABLE users RESTART IDENTITY CASCADE;
INSERT INTO users
(user_id, email, university_id, fname, lname, mname, program_id, role_id)
VALUES
-- system admin
(1, 'aaron_barcelita@dlsu.edu.ph', '12346950', 'Aaron John', 'Chucas', 'Chucas', NULL, 1),

-- advisers (Faculty role)
(2, 'marivic.tangkeko@dlsu.edu.ph', '11900001', 'Marivic', 'Tangkeko', 'S', NULL, 2),
(3, 'raphael.gonda@dlsu.edu.ph', '11900002', 'Raphael', 'Gonda', 'S', NULL, 2),
(4, 'rupert_tabilin@dlsu.edu.ph', '11900003', 'Rupert John', 'Tabilin', 'B', NULL, 2),

-- students (Student role)
(5, 'john_mendoza@dlsu.edu.ph', '12300001', 'John Kirbie', 'Mendoza', 'M', 1, 1),
(6, 'josh_cariaga@dlsu.edu.ph', '12306592', 'Maria', 'Santos', 'L', 2, 1),
(7, 'angela.tan@dlsu.edu.ph', '12100003', 'Angela', 'Tan', 'C', 1, 1),
(8, 'michael.chua@dlsu.edu.ph', '12100004', 'Michael', 'Chua', 'D', 2, 1),
(9, 'david.uy@dlsu.edu.ph', '12100005', 'David', 'Uy', 'E', 2, 1),
(10, 'jasmine.sy@dlsu.edu.ph', '12100006', 'Jasmine', 'Sy', 'F', 1, 1),

-- coordinators
(11, 'joaquin_inigo_deguzman@dlsu.edu.ph', '12300067', 'Joaquin Inigo', 'De Guzman', 'D', NULL, 3);

TRUNCATE TABLE ref_research_fields RESTART IDENTITY CASCADE;

INSERT INTO ref_research_fields (field_name) VALUES
('Artificial Intelligence'),
('Machine Learning'),
('Computer Vision'),
('Natural Language Processing'),
('Cybersecurity'),
('Data Science and Analytics'),
('Distributed Systems'),
('Human-Computer Interaction'),
('Computer Networks'),
('Software Engineering');

TRUNCATE TABLE capstone_groups RESTART IDENTITY CASCADE;

INSERT INTO capstone_groups
(group_id, group_name, program_id, group_adviser)
VALUES
(1, 'AI Informatics', 1, 2),
(2, 'Smart Traffic', 1, 3),
(3, 'Mobile Agentic', 1, 4);

TRUNCATE TABLE group_members RESTART IDENTITY CASCADE;

INSERT INTO group_members (group_id, student_id) VALUES
-- Group 1 (3 members)
(1, 5),
(1, 7),
(1, 10),

-- Group 2 (2 members)
(2, 6),
(2, 9),

-- Group 3 (1 member)
(3, 10);