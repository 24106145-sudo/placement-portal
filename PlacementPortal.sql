USE placement_portal;

-- 1. All registered user accounts (Admins, Officers, Students)
SELECT * FROM users;

-- 2. Student profile credentials & personal details
SELECT * FROM student_profiles;

-- 3. Academic performance (10th, 12th, SGPAs, CGPA, Backlogs)
SELECT * FROM academic_records;

-- 4. Registered hiring companies
SELECT * FROM companies;

-- 5. Published recruitment drives & eligibility criteria
SELECT * FROM placement_drives;

-- 6. Student applications, current stages & reviewer notes
SELECT * FROM applications;

-- 7. Scheduled interview rounds, test dates & venue links
SELECT * FROM drive_schedules;
