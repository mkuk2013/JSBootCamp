-- ===========================================================================
-- JS BOOTCAMP LMS DATABASE SCHEMA
-- Target Database: LibSQL / SQLite / Turso
-- ===========================================================================

-- 1. Drop existing tables if needed
DROP TABLE IF EXISTS students;

-- 2. Create students Table
-- Holds student profiles, experience points (XP), streak, roles, and admin accounts
CREATE TABLE students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    role TEXT NOT NULL DEFAULT 'student',   -- student, admin
    xp INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================================================
-- SEED DATA
-- Default accounts seeded with secure pre-calculated bcrypt hashes (salt rounds = 10)
-- ===========================================================================

-- 1. Seed Administrator Profile
-- Credentials: admin@jsbootcamp.com / admin123
INSERT INTO students (id, name, email, password, status, role, xp, streak)
VALUES (
    'admin_1', 
    'JS Bootcamp Admin', 
    'admin@jsbootcamp.com', 
    '$2b$10$w87FRjv03AdTnLrZlpkaWebDiSyz0nmPSL5WTJaFWzkerrxVVL8.m', 
    'approved', 
    'admin', 
    0, 
    0
);

-- 2. Seed Approved Student Profiles (Leaderboard & Dashboard Users)
-- Credentials: honey@jsbootcamp.com / pass_honey
INSERT INTO students (id, name, email, password, status, role, xp, streak)
VALUES (
    'stud_honey', 
    'Hon3y Chauhan', 
    'honey@jsbootcamp.com', 
    '$2b$10$nfUlTpXf90omF4WGPbrrj.6AHkftnS/KOblrHa01Mwng/4H0rowt6', 
    'approved', 
    'student', 
    1240, 
    5
);

-- Credentials: ananya@example.com / pass_student
INSERT INTO students (id, name, email, password, status, role, xp, streak)
VALUES (
    'stud_4', 
    'Ananya Sharma', 
    'ananya@example.com', 
    '$2b$10$RF9Gh5wKRpgrX05BKHq1teq8V2aFqohu5ITc8hOp30KPUlkUP9CQW', 
    'approved', 
    'student', 
    4890, 
    24
);

-- Credentials: aarav@example.com / pass_student
INSERT INTO students (id, name, email, password, status, role, xp, streak)
VALUES (
    'stud_5', 
    'Aarav Mehta', 
    'aarav@example.com', 
    '$2b$10$dFrJ.aTXi.76HGh3N8e/0.m3bPO.fk4owd1UMmmq8RzlO.1BT5geq', 
    'approved', 
    'student', 
    4210, 
    18
);

-- Credentials: neha@example.com / pass_student
INSERT INTO students (id, name, email, password, status, role, xp, streak)
VALUES (
    'stud_6', 
    'Neha Gupta', 
    'neha@example.com', 
    '$2b$10$ynyLxbXxEwIcLSBLWKWT6eICpodt6f.0Lc4jOsd6pOFp86K6Swe0K', 
    'approved', 
    'student', 
    3950, 
    12
);

-- Credentials: devendra@example.com / pass_student
INSERT INTO students (id, name, email, password, status, role, xp, streak)
VALUES (
    'stud_7', 
    'Devendra Singh', 
    'devendra@example.com', 
    '$2b$10$fAH93PoY2Kz.T3lkYvWz7OmDjYOCBRlGbrN3ZnAbIwfW7WeXF17Yu', 
    'approved', 
    'student', 
    3800, 
    15
);

-- Credentials: vikram@example.com / pass_student
INSERT INTO students (id, name, email, password, status, role, xp, streak)
VALUES (
    'stud_8', 
    'Vikram Rao', 
    'vikram@example.com', 
    '$2b$10$T70STxml3m6DZ2XPfAfNouUK190j7BVGVmrIKEeoSb.S5oh0ZKnua', 
    'approved', 
    'student', 
    1190, 
    3
);

-- 3. Seed Pending Student Profiles (Registration Approval Queue Queue)
-- Credentials: ravi@example.com / pass_student
INSERT INTO students (id, name, email, password, status, role, xp, streak)
VALUES (
    'stud_1', 
    'Ravi Kumar', 
    'ravi@example.com', 
    '$2b$10$fvhPC2kOzs.ChVkyqhGoqeeE1pJaX5Wf3aGNkuPQqzOyQfPEiCk/e', 
    'pending', 
    'student', 
    0, 
    0
);

-- Credentials: simran@example.com / pass_student
INSERT INTO students (id, name, email, password, status, role, xp, streak)
VALUES (
    'stud_2', 
    'Simran Jeet', 
    'simran@example.com', 
    '$2b$10$B9I2wmjFq1IJA22p13ZuAuHs2LPyPVGq/5fJSQeNxrci377SHfC7.', 
    'pending', 
    'student', 
    0, 
    0
);

-- Credentials: kabir@example.com / pass_student
INSERT INTO students (id, name, email, password, status, role, xp, streak)
VALUES (
    'stud_3', 
    'Kabir Das', 
    'kabir@example.com', 
    '$2b$10$E.o5VaU3cKKgWsZancUoP.2Gm5iQzoWFxB3jH6cxUJmTjB.AQG.uC', 
    'pending', 
    'student', 
    0, 
    0
);
