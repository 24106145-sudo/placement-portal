USE placement_portal;

SELECT id, full_name, email, role, password_hash, created_at 
FROM users;
SELECT * FROM student_profiles;
SELECT * FROM academic_records;


-- 1. View registered recruiting companies
 SELECT * FROM companies;

-- 2. View all published job drives and cutoff rules
SELECT * FROM placement_drives;

-- 3. View student applications and stage statuses (Applied, Shortlisted, Selected)
SELECT * FROM applications;
