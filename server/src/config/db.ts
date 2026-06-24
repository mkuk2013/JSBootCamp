import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.warn('Warning: TURSO_DATABASE_URL is not defined in environment variables. Database client is running on local fallback file: local.db');
}

export const db = createClient({
  url: url || 'file:local.db',
  authToken: authToken,
});

// Test connection helper
export const testDbConnection = async (): Promise<boolean> => {
  try {
    await db.execute('SELECT 1;');
    return true;
  } catch (error) {
    console.error('Failed to establish database connection:', error);
    return false;
  }
};

// Database Initialization and Seeding
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('[Database] Checking tables...');
    
    // Create Students Table (ensure base schema)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        role TEXT NOT NULL DEFAULT 'student',
        xp INTEGER NOT NULL DEFAULT 0,
        streak INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Perform migrations to add columns if they do not exist
    try {
      await db.execute('ALTER TABLE students ADD COLUMN level INTEGER NOT NULL DEFAULT 1;');
      console.log('[Database Migration] Added level column to students table.');
    } catch (e) {
      // Column already exists
    }

    try {
      await db.execute('ALTER TABLE students ADD COLUMN last_active_at TEXT DEFAULT CURRENT_TIMESTAMP;');
      console.log('[Database Migration] Added last_active_at column to students table.');
    } catch (e) {
      // Column already exists
    }

    try {
      await db.execute('ALTER TABLE students ADD COLUMN avatar_url TEXT;');
      console.log('[Database Migration] Added avatar_url column to students table.');
    } catch (e) {
      // Column already exists
    }

    try {
      await db.execute('ALTER TABLE students ADD COLUMN last_task_id INTEGER;');
      console.log('[Database Migration] Added last_task_id column to students table.');
    } catch (e) {
      // Column already exists
    }
    
    // Create Levels Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS levels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        order_num INTEGER UNIQUE
      );
    `);

    // Create Modules Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level_id INTEGER NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        order_num INTEGER NOT NULL
      );
    `);

    // Create Tasks Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        question TEXT NOT NULL,
        starter_code TEXT NOT NULL,
        expected_output TEXT,
        test_cases TEXT NOT NULL,
        hints TEXT,
        examples TEXT,
        difficulty TEXT NOT NULL,
        order_num INTEGER DEFAULT 0
      );
    `);

    // Create Submissions Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        result TEXT NOT NULL,
        score INTEGER NOT NULL,
        output TEXT,
        runtime_ms INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Achievements Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        xp_required INTEGER NOT NULL,
        badge_color TEXT NOT NULL
      );
    `);

    // Create User Achievements Junction Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        user_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, achievement_id)
      );
    `);

    // Check if students table is empty or needs correct seed structure
    const result = await db.execute('SELECT count(*) as count FROM students;');
    const count = Number(result.rows[0].count);

    // Check if admin is present
    const adminCheck = await db.execute("SELECT count(*) as count FROM students WHERE role = 'admin';");
    const adminCount = Number(adminCheck.rows[0].count);

    // Check if any passwords are plain text (i.e. don't start with '$2')
    const plainCheck = await db.execute("SELECT count(*) as count FROM students WHERE password NOT LIKE '$2%';");
    const plainCount = Number(plainCheck.rows[0].count);
    
    if (count === 0 || adminCount === 0 || plainCount > 0) {
      console.log('[Database] Re-seeding student/admin accounts with correct hashed passwords...');
      await db.execute('DELETE FROM students;');
      
      const seedQueries = [
        // Admin account
        { id: 'admin_1', name: 'JS Bootcamp Admin', email: 'admin@jsbootcamp.com', pass: 'admin123', status: 'approved', role: 'admin', xp: 0, streak: 0, level: 1 },

        // Pending approval queue students
        { id: 'stud_1', name: 'Ravi Kumar', email: 'ravi@example.com', pass: 'pass_student', status: 'pending', role: 'student', xp: 0, streak: 0, level: 1 },
        { id: 'stud_2', name: 'Simran Jeet', email: 'simran@example.com', pass: 'pass_student', status: 'pending', role: 'student', xp: 0, streak: 0, level: 1 },
        { id: 'stud_3', name: 'Kabir Das', email: 'kabir@example.com', pass: 'pass_student', status: 'pending', role: 'student', xp: 0, streak: 0, level: 1 },
        
        // Active leaderboard students
        { id: 'stud_4', name: 'Ananya Sharma', email: 'ananya@example.com', pass: 'pass_student', status: 'approved', role: 'student', xp: 4890, streak: 24, level: 5 },
        { id: 'stud_5', name: 'Aarav Mehta', email: 'aarav@example.com', pass: 'pass_student', status: 'approved', role: 'student', xp: 4210, streak: 18, level: 5 },
        { id: 'stud_6', name: 'Neha Gupta', email: 'neha@example.com', pass: 'pass_student', status: 'approved', role: 'student', xp: 3950, streak: 12, level: 4 },
        { id: 'stud_7', name: 'Devendra Singh', email: 'devendra@example.com', pass: 'pass_student', status: 'approved', role: 'student', xp: 3800, streak: 15, level: 4 },
        { id: 'stud_8', name: 'Vikram Rao', email: 'vikram@example.com', pass: 'pass_student', status: 'approved', role: 'student', xp: 1190, streak: 3, level: 2 },
        
        // Current dashboard user
        { id: 'stud_honey', name: 'Hon3y Chauhan', email: 'honey@jsbootcamp.com', pass: 'pass_honey', status: 'approved', role: 'student', xp: 1240, streak: 5, level: 2 }
      ];

      const saltRounds = 10;
      for (const q of seedQueries) {
        const hashedPassword = bcrypt.hashSync(q.pass, saltRounds);
        await db.execute({
          sql: `INSERT INTO students (id, name, email, password, status, role, xp, streak, level) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          args: [q.id, q.name, q.email, hashedPassword, q.status, q.role, q.xp, q.streak, q.level]
        });
      }
      console.log('[Database] Hashed seeding of users complete.');
    }

    // Seed levels
    const levelsCountCheck = await db.execute('SELECT count(*) as count FROM levels;');
    const levelsCount = Number(levelsCountCheck.rows[0].count);
    const modulesCountCheck = await db.execute('SELECT count(*) as count FROM modules;');
    const modulesCount = Number(modulesCountCheck.rows[0].count);
    const tasksCountCheck = await db.execute('SELECT count(*) as count FROM tasks;');
    const tasksCount = Number(tasksCountCheck.rows[0].count);

    // Check if task 1 has the old function starter code
    const task1Check = await db.execute('SELECT starter_code FROM tasks WHERE id = 1;');
    const hasOldTask1 = task1Check.rows.length > 0 && 
      typeof task1Check.rows[0].starter_code === 'string' && 
      task1Check.rows[0].starter_code.includes('function');

    if (levelsCount === 0 || modulesCount !== 22 || tasksCount !== 72 || hasOldTask1) {
      console.log('[Database] Seeding levels curriculum with 22 modules...');
      // Safe drop to recreate and avoid duplicate constraints
      await db.execute('DELETE FROM tasks;');
      await db.execute('DELETE FROM modules;');
      await db.execute('DELETE FROM levels;');

      await db.execute(`INSERT INTO levels (id, title, description, order_num) VALUES 
        (1, '🌱 Level 1: Beginner', 'Master JavaScript basics, data types, operators, prompt inputs, conditional control flows, and loop mechanics.', 1),
        (2, '⚡ Level 2: Intermediate', 'Dive into functions, strings, arrays, mapping/filters, objects, DOM manipulation, events, and modern ES6.', 2),
        (3, '🚀 Level 3: Advanced', 'Explore scope structures, closures, asynchronous actions, fetching APIs, local storage, OOP, error handling, and projects.', 3);`);

      // Seed modules
      const modulesData = [
        { id: 1, level_id: 1, title: 'JavaScript Basics', content: '# JavaScript Basics\n\nIntro to JS, internal/external script loading, console logs, comments, and variables (var, let, const).', order_num: 1 },
        { id: 2, level_id: 1, title: 'Data Types', content: '# Data Types\n\nLearn Strings, Numbers, Booleans, Null, Undefined, BigInt, and Symbols.', order_num: 2 },
        { id: 3, level_id: 1, title: 'Operators', content: '# Operators\n\nArithmetic, Assignment, Comparison, and Logical operators.', order_num: 3 },
        { id: 4, level_id: 1, title: 'User Input', content: '# User Input\n\nPrompting dialogs via prompt(), confirm(), and alert() globals.', order_num: 4 },
        { id: 5, level_id: 1, title: 'Conditional Statements', content: '# Conditional Statements\n\nMake decisions with if, if-else, else-if, and switch blocks.', order_num: 5 },
        { id: 6, level_id: 1, title: 'Loops', content: '# Loops\n\nIterate with for, while, do-while, break, and continue statement mechanics.', order_num: 6 },
        { id: 7, level_id: 2, title: 'Functions', content: '# Functions\n\nFunctions, declarations, expressions, arrow functions, inputs, parameters, and returns.', order_num: 1 },
        { id: 8, level_id: 2, title: 'Strings', content: '# Strings\n\nManipulate string arrays using search, slice, and modern string templates.', order_num: 2 },
        { id: 9, level_id: 2, title: 'Arrays', content: '# Arrays\n\nArray lists, push, pop, shift, unshift, slice, and splice.', order_num: 3 },
        { id: 10, level_id: 2, title: 'Array Advanced Methods', content: '# Array Advanced Methods\n\nLearn filter mapping and accumulation using map(), filter(), reduce(), find(), and sort().', order_num: 4 },
        { id: 11, level_id: 2, title: 'Objects', content: '# Objects\n\nStore key-value properties, methods, and nested objects.', order_num: 5 },
        { id: 12, level_id: 2, title: 'DOM Manipulation', content: '# DOM Manipulation\n\nSelect and manipulate document nodes using query selectors, innerHTML, and textContent.', order_num: 6 },
        { id: 13, level_id: 2, title: 'Events', content: '# Events handling\n\nListen to mouse clicks, keyboard triggers, and inputs.', order_num: 7 },
        { id: 14, level_id: 2, title: 'ES6 Features', content: '# ES6 Features\n\nImprove syntax structure with arrow functions, destructuring, template literals, and spread operator.', order_num: 8 },
        { id: 15, level_id: 3, title: 'Advanced JavaScript', content: '# Advanced JavaScript\n\nUnderstand scopes, hoisting, Closures, and Call Stack.', order_num: 1 },
        { id: 16, level_id: 3, title: 'Asynchronous JavaScript', content: '# Asynchronous JavaScript\n\nLearn timers, setTimeout, Promise constructs, and async/await syntax.', order_num: 2 },
        { id: 17, level_id: 3, title: 'JSON & API', content: '# JSON & API\n\nParse JSON, stringify objects, and fetch resources.', order_num: 3 },
        { id: 18, level_id: 3, title: 'Local Storage', content: '# Local Storage & Session storage\n\nSave settings via localStorage.', order_num: 4 },
        { id: 19, level_id: 3, title: 'OOP JavaScript', content: '# OOP JavaScript\n\nLearn classes, custom constructors, inheritance, and encapsulation.', order_num: 5 },
        { id: 20, level_id: 3, title: 'Error Handling', content: '# Error Handling\n\nAvoid breaks using try, catch, finally, and custom throw statements.', order_num: 6 },
        { id: 21, level_id: 3, title: 'Mini Projects', content: '# Mini Projects\n\nPractice creating Calculator, BMI counter, Stopwatch, and digital clocks.', order_num: 7 },
        { id: 22, level_id: 3, title: 'Advanced Projects', content: '# Advanced Projects\n\nDesign full systems like News App, Weather maps, and E-commerce flows.', order_num: 8 }
      ];

      for (const m of modulesData) {
        await db.execute({
          sql: `INSERT INTO modules (id, level_id, title, content, order_num) VALUES (?, ?, ?, ?, ?);`,
          args: [m.id, m.level_id, m.title, m.content, m.order_num]
        });
      }

      // Seed tasks
      const tasksData = [
        // Module 1: JavaScript Basics (IDs 1-3)
        {
          id: 1,
          module_id: 1,
          title: 'Print Name',
          question: 'Write code to print the name `"Hon3y Chauhan"` to the console using `console.log`.',
          starter_code: '// Write your code below this line\n',
          expected_output: 'Hon3y Chauhan',
          test_cases: JSON.stringify([{ expected: 'Hon3y Chauhan', type: 'script' }]),
          hints: JSON.stringify(['Use console.log().', 'Put the string in quotes.']),
          examples: '```javascript\nconsole.log("Hon3y Chauhan");\n```',
          difficulty: 'easy',
          order_num: 1
        },
        {
          id: 2,
          module_id: 1,
          title: 'Print School Name',
          question: 'Write code to print the school name `"JS Bootcamp"` to the console using `console.log`.',
          starter_code: '// Write your code below this line\n',
          expected_output: 'JS Bootcamp',
          test_cases: JSON.stringify([{ expected: 'JS Bootcamp', type: 'script' }]),
          hints: JSON.stringify(['Use console.log().']),
          examples: '```javascript\nconsole.log("JS Bootcamp");\n```',
          difficulty: 'easy',
          order_num: 2
        },
        {
          id: 3,
          module_id: 1,
          title: 'Print Multiple Lines',
          question: 'Write code to print three lines: `"Line 1"`, `"Line 2"`, and `"Line 3"` to the console.',
          starter_code: '// Write your code below this line\n',
          expected_output: 'Line 1\nLine 2\nLine 3',
          test_cases: JSON.stringify([{ expected: 'Line 1\nLine 2\nLine 3', type: 'script' }]),
          hints: JSON.stringify(['Use console.log() multiple times.']),
          examples: '```javascript\nconsole.log("Line 1");\nconsole.log("Line 2");\nconsole.log("Line 3");\n```',
          difficulty: 'easy',
          order_num: 3
        },

        // Module 2: Data Types (IDs 4-6)
        {
          id: 4,
          module_id: 2,
          title: 'Student Bio Program',
          question: 'Write a function named `getBio` that returns an object representing student details with: `name` (string `"Hon3y"`), `age` (number `25`), and `isStudent` (boolean `true`).',
          starter_code: 'function getBio() {\n  // Write your code here\n}',
          expected_output: '{"name":"Hon3y","age":25,"isStudent":true}',
          test_cases: JSON.stringify([{ input: [], expected: { name: 'Hon3y', age: 25, isStudent: true }, funcName: 'getBio', type: 'func' }]),
          hints: JSON.stringify(['Return an object literal.']),
          examples: '```javascript\ngetBio(); // returns { name: "Hon3y", age: 25, isStudent: true }\n```',
          difficulty: 'easy',
          order_num: 1
        },
        {
          id: 5,
          module_id: 2,
          title: 'Age Calculator',
          question: 'Write a function `calcAge(birthYear)` that returns the age based on the current year `2026`.',
          starter_code: 'function calcAge(birthYear) {\n  // Write your code here\n}',
          expected_output: '26',
          test_cases: JSON.stringify([
            { input: [2000], expected: 26, funcName: 'calcAge', type: 'func' },
            { input: [1990], expected: 36, funcName: 'calcAge', type: 'func' }
          ]),
          hints: JSON.stringify(['Subtract birthYear from 2026.']),
          examples: '```javascript\ncalcAge(2000); // returns 26\n```',
          difficulty: 'easy',
          order_num: 2
        },
        {
          id: 6,
          module_id: 2,
          title: 'Data Type Checker',
          question: 'Write a function `checkType(val)` that returns the typeof string of the given value.',
          starter_code: 'function checkType(val) {\n  // Write your code here\n}',
          expected_output: 'string',
          test_cases: JSON.stringify([
            { input: ['hello'], expected: 'string', funcName: 'checkType', type: 'func' },
            { input: [123], expected: 'number', funcName: 'checkType', type: 'func' },
            { input: [true], expected: 'boolean', funcName: 'checkType', type: 'func' }
          ]),
          hints: JSON.stringify(['Use the typeof operator.']),
          examples: '```javascript\ncheckType(123); // returns "number"\n```',
          difficulty: 'easy',
          order_num: 3
        },

        // Module 3: Operators (IDs 7-9)
        {
          id: 7,
          module_id: 3,
          title: 'Calculator',
          question: 'Write a function `calculate(a, b, op)` that takes two numbers and a math operator symbol (`"+"`, `"-"`, `"*"` or `"/"`) and returns the computed result.',
          starter_code: 'function calculate(a, b, op) {\n  // Write your code here\n}',
          expected_output: '5',
          test_cases: JSON.stringify([
            { input: [2, 3, '+'], expected: 5, funcName: 'calculate', type: 'func' },
            { input: [10, 2, '/'], expected: 5, funcName: 'calculate', type: 'func' },
            { input: [4, 5, '*'], expected: 20, funcName: 'calculate', type: 'func' }
          ]),
          hints: JSON.stringify(['Use if-else or switch case statements.']),
          examples: '```javascript\ncalculate(2, 3, "+"); // returns 5\n```',
          difficulty: 'easy',
          order_num: 1
        },
        {
          id: 8,
          module_id: 3,
          title: 'Percentage Calculator',
          question: 'Write a function `calcPercentage(obtained, total)` that returns the percentage (from 0 to 100).',
          starter_code: 'function calcPercentage(obtained, total) {\n  // Write your code here\n}',
          expected_output: '80',
          test_cases: JSON.stringify([
            { input: [80, 100], expected: 80, funcName: 'calcPercentage', type: 'func' },
            { input: [150, 200], expected: 75, funcName: 'calcPercentage', type: 'func' }
          ]),
          hints: JSON.stringify(['Multiply obtained/total by 100.']),
          examples: '```javascript\ncalcPercentage(40, 50); // returns 80\n```',
          difficulty: 'easy',
          order_num: 2
        },
        {
          id: 9,
          module_id: 3,
          title: 'Area Calculator',
          question: 'Write a function `calcArea(length, width)` that returns the area of a rectangle.',
          starter_code: 'function calcArea(length, width) {\n  // Write your code here\n}',
          expected_output: '50',
          test_cases: JSON.stringify([
            { input: [10, 5], expected: 50, funcName: 'calcArea', type: 'func' },
            { input: [7, 3], expected: 21, funcName: 'calcArea', type: 'func' }
          ]),
          hints: JSON.stringify(['Multiply length by width.']),
          examples: '```javascript\ncalcArea(10, 5); // returns 50\n```',
          difficulty: 'easy',
          order_num: 3
        },

        // Module 4: User Input (IDs 10-12)
        {
          id: 10,
          module_id: 4,
          title: 'Name Input Program',
          question: 'Write a function `greetUser(name)` that takes a name and returns a string like `"Hello, [name]!"`. If name is empty, default to `"Guest"`.',
          starter_code: 'function greetUser(name) {\n  // Write your code here\n}',
          expected_output: 'Hello, Hon3y!',
          test_cases: JSON.stringify([
            { input: ['Hon3y'], expected: 'Hello, Hon3y!', funcName: 'greetUser', type: 'func' },
            { input: [''], expected: 'Hello, Guest!', funcName: 'greetUser', type: 'func' }
          ]),
          hints: JSON.stringify(['Use string concatenation or template literal. Check if empty.']),
          examples: '```javascript\ngreetUser("Hon3y"); // returns "Hello, Hon3y!"\n```',
          difficulty: 'easy',
          order_num: 1
        },
        {
          id: 11,
          module_id: 4,
          title: 'Age Checker',
          question: 'Write a function `isAdult(age)` that returns `true` if age is >= 18, and `false` otherwise.',
          starter_code: 'function isAdult(age) {\n  // Write your code here\n}',
          expected_output: 'true',
          test_cases: JSON.stringify([
            { input: [20], expected: true, funcName: 'isAdult', type: 'func' },
            { input: [16], expected: false, funcName: 'isAdult', type: 'func' }
          ]),
          hints: JSON.stringify(['Use comparison operator >=.']),
          examples: '```javascript\nisAdult(20); // returns true\n```',
          difficulty: 'easy',
          order_num: 2
        },
        {
          id: 12,
          module_id: 4,
          title: 'Simple Form Input',
          question: 'Write a function `validateForm(email)` that checks if the string `email` contains `"@"` and is longer than 5 characters.',
          starter_code: 'function validateForm(email) {\n  // Write your code here\n}',
          expected_output: 'true',
          test_cases: JSON.stringify([
            { input: ['honey@js.com'], expected: true, funcName: 'validateForm', type: 'func' },
            { input: ['honey'], expected: false, funcName: 'validateForm', type: 'func' },
            { input: ['@a.b'], expected: false, funcName: 'validateForm', type: 'func' }
          ]),
          hints: JSON.stringify(['Use includes() and length check.']),
          examples: '```javascript\nvalidateForm("honey@js.com"); // returns true\n```',
          difficulty: 'easy',
          order_num: 3
        },

        // Module 5: Conditional Statements (IDs 13-16)
        {
          id: 13,
          module_id: 5,
          title: 'Even/Odd',
          question: 'Write a function `isEven(n)` that returns `true` if `n` is even, and `false` if it is odd.',
          starter_code: 'function isEven(n) {\n  // Write your code here\n}',
          expected_output: 'true',
          test_cases: JSON.stringify([
            { input: [4], expected: true, funcName: 'isEven', type: 'func' },
            { input: [7], expected: false, funcName: 'isEven', type: 'func' }
          ]),
          hints: JSON.stringify(['Use modulo operator %.']),
          examples: '```javascript\nisEven(4); // returns true\n```',
          difficulty: 'easy',
          order_num: 1
        },
        {
          id: 14,
          module_id: 5,
          title: 'Grade Calculator',
          question: 'Write a function `getGrade(marks)` returning `"A"` for marks >= 90, `"B"` for marks >= 80, `"C"` for marks >= 70, and `"F"` otherwise.',
          starter_code: 'function getGrade(marks) {\n  // Write your code here\n}',
          expected_output: 'A',
          test_cases: JSON.stringify([
            { input: [95], expected: 'A', funcName: 'getGrade', type: 'func' },
            { input: [82], expected: 'B', funcName: 'getGrade', type: 'func' },
            { input: [65], expected: 'F', funcName: 'getGrade', type: 'func' }
          ]),
          hints: JSON.stringify(['Use if-else chain.']),
          examples: '```javascript\ngetGrade(95); // returns "A"\n```',
          difficulty: 'easy',
          order_num: 2
        },
        {
          id: 15,
          module_id: 5,
          title: 'Voting Eligibility',
          question: 'Write a function `canVote(age)` returning `true` if age >= 18, and `false` otherwise.',
          starter_code: 'function canVote(age) {\n  // Write your code here\n}',
          expected_output: 'true',
          test_cases: JSON.stringify([
            { input: [18], expected: true, funcName: 'canVote', type: 'func' },
            { input: [15], expected: false, funcName: 'canVote', type: 'func' }
          ]),
          hints: JSON.stringify(['Check if age is greater than or equal to 18.']),
          examples: '```javascript\ncanVote(18); // returns true\n```',
          difficulty: 'easy',
          order_num: 3
        },
        {
          id: 16,
          module_id: 5,
          title: 'Largest Number',
          question: 'Write a function `findLargest(a, b, c)` that returns the maximum value among three numbers.',
          starter_code: 'function findLargest(a, b, c) {\n  // Write your code here\n}',
          expected_output: '10',
          test_cases: JSON.stringify([
            { input: [3, 10, 5], expected: 10, funcName: 'findLargest', type: 'func' },
            { input: [15, 8, 2], expected: 15, funcName: 'findLargest', type: 'func' }
          ]),
          hints: JSON.stringify(['Use Math.max() or nested comparisons.']),
          examples: '```javascript\nfindLargest(3, 10, 5); // returns 10\n```',
          difficulty: 'easy',
          order_num: 4
        },

        // Module 6: Loops (IDs 17-20)
        {
          id: 17,
          module_id: 6,
          title: 'Table Generator',
          question: 'Write a function `getTable(n)` that returns an array of the first 10 multiples of `n`.',
          starter_code: 'function getTable(n) {\n  // Write your code here\n}',
          expected_output: '[5,10,15,20,25,30,35,40,45,50]',
          test_cases: JSON.stringify([
            { input: [5], expected: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50], funcName: 'getTable', type: 'func' },
            { input: [2], expected: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20], funcName: 'getTable', type: 'func' }
          ]),
          hints: JSON.stringify(['Use a for loop running from 1 to 10.']),
          examples: '```javascript\ngetTable(5); // returns [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]\n```',
          difficulty: 'medium',
          order_num: 1
        },
        {
          id: 18,
          module_id: 6,
          title: 'Factorial',
          question: 'Write a function `factorial(n)` that returns the factorial of integer `n`. Recall `factorial(0) === 1`.',
          starter_code: 'function factorial(n) {\n  // Write your code here\n}',
          expected_output: '120',
          test_cases: JSON.stringify([
            { input: [5], expected: 120, funcName: 'factorial', type: 'func' },
            { input: [0], expected: 1, funcName: 'factorial', type: 'func' }
          ]),
          hints: JSON.stringify(['Iterate from 1 to n and multiply.']),
          examples: '```javascript\nfactorial(5); // returns 120\n```',
          difficulty: 'medium',
          order_num: 2
        },
        {
          id: 19,
          module_id: 6,
          title: 'Fibonacci Series',
          question: 'Write a function `getFibonacci(n)` that returns the first `n` numbers of the Fibonacci sequence in an array. Assume `n >= 1`.',
          starter_code: 'function getFibonacci(n) {\n  // Write your code here\n}',
          expected_output: '[0,1,1,2,3]',
          test_cases: JSON.stringify([
            { input: [5], expected: [0, 1, 1, 2, 3], funcName: 'getFibonacci', type: 'func' },
            { input: [3], expected: [0, 1, 1], funcName: 'getFibonacci', type: 'func' }
          ]),
          hints: JSON.stringify(['Start with [0, 1] and append sum of last two values.']),
          examples: '```javascript\ngetFibonacci(5); // returns [0, 1, 1, 2, 3]\n```',
          difficulty: 'medium',
          order_num: 3
        },
        {
          id: 20,
          module_id: 6,
          title: 'Number Patterns',
          question: 'Write a function `generatePattern(rows)` that returns a number pattern string up to `rows`. Each line should have numbers from 1 to row index, separated by newline. For example, for rows=3: `"1\\n12\\n123\\n"`.',
          starter_code: 'function generatePattern(rows) {\n  // Write your code here\n}',
          expected_output: '1\n12\n123\n',
          test_cases: JSON.stringify([
            { input: [3], expected: '1\n12\n123\n', funcName: 'generatePattern', type: 'func' },
            { input: [1], expected: '1\n', funcName: 'generatePattern', type: 'func' }
          ]),
          hints: JSON.stringify(['Use nested loops, appending integers to a line, then appending newline.']),
          examples: '```javascript\ngeneratePattern(3); // returns "1\\n12\\n123\\n"\n```',
          difficulty: 'medium',
          order_num: 4
        },

        // Module 7: Functions (IDs 21-23)
        {
          id: 21,
          module_id: 7,
          title: 'Add Numbers',
          question: 'Write a function `add(a, b)` that returns the sum of two numbers.',
          starter_code: 'function add(a, b) {\n  // Write your code here\n}',
          expected_output: '7',
          test_cases: JSON.stringify([{ input: [3, 4], expected: 7, funcName: 'add', type: 'func' }]),
          hints: JSON.stringify(['Return a + b.']),
          examples: '```javascript\nadd(3, 4); // returns 7\n```',
          difficulty: 'easy',
          order_num: 1
        },
        {
          id: 22,
          module_id: 7,
          title: 'Calculator Function',
          question: 'Write a function `runOperation(a, b, opFunc)` that takes two numbers and a math operations callback function `opFunc` and returns the result of calling `opFunc(a, b)`.',
          starter_code: 'function runOperation(a, b, opFunc) {\n  // Write your code here\n}',
          expected_output: '20',
          test_cases: JSON.stringify([
            { input: [4, 5, '(x, y) => x * y'], expected: 20, funcName: 'runOperation', type: 'func_eval' }
          ]),
          hints: JSON.stringify(['Call opFunc(a, b) directly and return it.']),
          examples: '```javascript\nrunOperation(4, 5, (x, y) => x * y); // returns 20\n```',
          difficulty: 'medium',
          order_num: 2
        },
        {
          id: 23,
          module_id: 7,
          title: 'Greeting Function',
          question: 'Write a function `getGreeting()` that returns the exact string `"Hello, JavaScript!"`.',
          starter_code: 'function getGreeting() {\n  // Write your code here\n}',
          expected_output: 'Hello, JavaScript!',
          test_cases: JSON.stringify([{ input: [], expected: 'Hello, JavaScript!', funcName: 'getGreeting', type: 'func' }]),
          hints: JSON.stringify(['Return "Hello, JavaScript!".']),
          examples: '```javascript\ngetGreeting(); // returns "Hello, JavaScript!"\n```',
          difficulty: 'easy',
          order_num: 3
        },

        // Module 8: Strings (IDs 24-26)
        {
          id: 24,
          module_id: 8,
          title: 'Reverse String',
          question: 'Write a function `reverseString(str)` that reverses the characters of a string.',
          starter_code: 'function reverseString(str) {\n  // Write your code here\n}',
          expected_output: 'olleh',
          test_cases: JSON.stringify([
            { input: ['hello'], expected: 'olleh', funcName: 'reverseString', type: 'func' },
            { input: ['js'], expected: 'sj', funcName: 'reverseString', type: 'func' }
          ]),
          hints: JSON.stringify(['Use split(), reverse(), and join().']),
          examples: '```javascript\nreverseString("hello"); // returns "olleh"\n```',
          difficulty: 'medium',
          order_num: 1
        },
        {
          id: 25,
          module_id: 8,
          title: 'Palindrome Checker',
          question: 'Write a function `isPalindrome(str)` that returns `true` if `str` reads the same forwards and backwards, and `false` otherwise.',
          starter_code: 'function isPalindrome(str) {\n  // Write your code here\n}',
          expected_output: 'true',
          test_cases: JSON.stringify([
            { input: ['racecar'], expected: true, funcName: 'isPalindrome', type: 'func' },
            { input: ['hello'], expected: false, funcName: 'isPalindrome', type: 'func' }
          ]),
          hints: JSON.stringify(['Compare str with its reversed version.']),
          examples: '```javascript\nisPalindrome("racecar"); // returns true\n```',
          difficulty: 'medium',
          order_num: 2
        },
        {
          id: 26,
          module_id: 8,
          title: 'Count Vowels',
          question: 'Write a function `countVowels(str)` that counts and returns the number of vowels (a, e, i, o, u, case-insensitive) in `str`.',
          starter_code: 'function countVowels(str) {\n  // Write your code here\n}',
          expected_output: '3',
          test_cases: JSON.stringify([
            { input: ['JavaScript'], expected: 3, funcName: 'countVowels', type: 'func' },
            { input: ['sky'], expected: 0, funcName: 'countVowels', type: 'func' }
          ]),
          hints: JSON.stringify(['Iterate through characters or use match(/[^aeiou]/gi).']),
          examples: '```javascript\ncountVowels("JavaScript"); // returns 3\n```',
          difficulty: 'medium',
          order_num: 3
        },

        // Module 9: Arrays (IDs 27-29)
        {
          id: 27,
          module_id: 9,
          title: 'Largest Number',
          question: 'Write a function `findMax(arr)` that returns the maximum number in an array.',
          starter_code: 'function findMax(arr) {\n  // Write your code here\n}',
          expected_output: '10',
          test_cases: JSON.stringify([
            { input: [[3, 10, 5, 2]], expected: 10, funcName: 'findMax', type: 'func' },
            { input: [[-1, -5]], expected: -1, funcName: 'findMax', type: 'func' }
          ]),
          hints: JSON.stringify(['Use Math.max(...arr) or iterate.']),
          examples: '```javascript\nfindMax([3, 10, 5, 2]); // returns 10\n```',
          difficulty: 'easy',
          order_num: 1
        },
        {
          id: 28,
          module_id: 9,
          title: 'Smallest Number',
          question: 'Write a function `findMin(arr)` that returns the minimum number in an array.',
          starter_code: 'function findMin(arr) {\n  // Write your code here\n}',
          expected_output: '2',
          test_cases: JSON.stringify([
            { input: [[3, 10, 5, 2]], expected: 2, funcName: 'findMin', type: 'func' },
            { input: [[5, 9]], expected: 5, funcName: 'findMin', type: 'func' }
          ]),
          hints: JSON.stringify(['Use Math.min(...arr) or iterate.']),
          examples: '```javascript\nfindMin([3, 10, 5, 2]); // returns 2\n```',
          difficulty: 'easy',
          order_num: 2
        },
        {
          id: 29,
          module_id: 9,
          title: 'Average Calculator',
          question: 'Write a function `average(arr)` that calculates the average of elements in `arr`.',
          starter_code: 'function average(arr) {\n  // Write your code here\n}',
          expected_output: '3.5',
          test_cases: JSON.stringify([
            { input: [[2, 4, 6, 2]], expected: 3.5, funcName: 'average', type: 'func' }
          ]),
          hints: JSON.stringify(['Sum all elements, divide by array length.']),
          examples: '```javascript\naverage([2, 4, 6, 2]); // returns 3.5\n```',
          difficulty: 'easy',
          order_num: 3
        },

        // Module 10: Array Advanced Methods (IDs 30-32)
        {
          id: 30,
          module_id: 10,
          title: 'Student Marks System',
          question: 'Write a function `sumPassingMarks(marks)` that filters marks >= 50 and returns their sum.',
          starter_code: 'function sumPassingMarks(marks) {\n  // Write your code here\n}',
          expected_output: '150',
          test_cases: JSON.stringify([
            { input: [[40, 80, 70, 30]], expected: 150, funcName: 'sumPassingMarks', type: 'func' }
          ]),
          hints: JSON.stringify(['Use filter() and reduce().']),
          examples: '```javascript\nsumPassingMarks([40, 80, 70, 30]); // returns 150\n```',
          difficulty: 'medium',
          order_num: 1
        },
        {
          id: 31,
          module_id: 10,
          title: 'Product Filter',
          question: 'Write a function `filterProducts(products, maxPrice)` that takes a products array (`[{ name: string, price: number }]`) and returns a filtered array containing only products with price <= maxPrice.',
          starter_code: 'function filterProducts(products, maxPrice) {\n  // Write your code here\n}',
          expected_output: '[{"name":"laptop","price":800}]',
          test_cases: JSON.stringify([
            { 
              input: [[{ name: 'laptop', price: 800 }, { name: 'phone', price: 1200 }], 1000], 
              expected: [{ name: 'laptop', price: 800 }], 
              funcName: 'filterProducts', 
              type: 'func' 
            }
          ]),
          hints: JSON.stringify(['Use array filter() method.']),
          examples: '```javascript\nfilterProducts([{name: "laptop", price: 800}], 1000); // returns [{name: "laptop", price: 800}]\n```',
          difficulty: 'medium',
          order_num: 2
        },
        {
          id: 32,
          module_id: 10,
          title: 'Shopping Cart',
          question: 'Write a function `calculateTotal(cart, taxRate)` that sums the price * quantity of cart elements (`[{ price: number, qty: number }]`), then adds tax (`taxRate` as a decimal percentage, e.g. 0.1 for 10%), returning the total.',
          starter_code: 'function calculateTotal(cart, taxRate) {\n  // Write your code here\n}',
          expected_output: '110',
          test_cases: JSON.stringify([
            { 
              input: [[{ price: 50, qty: 2 }], 0.1], 
              expected: 110, 
              funcName: 'calculateTotal', 
              type: 'func' 
            }
          ]),
          hints: JSON.stringify(['Compute subtotal, then multiply by (1 + taxRate).']),
          examples: '```javascript\ncalculateTotal([{price: 50, qty: 2}], 0.1); // returns 110\n```',
          difficulty: 'medium',
          order_num: 3
        },

        // Module 11: Objects (IDs 33-35)
        {
          id: 33,
          module_id: 11,
          title: 'Student Object',
          question: 'Write a function `getStudentInfo(student)` that returns a summary string `"Name: [name], Age: [age]"` from the student object properties.',
          starter_code: 'function getStudentInfo(student) {\n  // Write your code here\n}',
          expected_output: 'Name: Ali, Age: 20',
          test_cases: JSON.stringify([{ input: [{ name: 'Ali', age: 20 }], expected: 'Name: Ali, Age: 20', funcName: 'getStudentInfo', type: 'func' }]),
          hints: JSON.stringify(['Use string template literals.']),
          examples: '```javascript\ngetStudentInfo({name: "Ali", age: 20}); // returns "Name: Ali, Age: 20"\n```',
          difficulty: 'easy',
          order_num: 1
        },
        {
          id: 34,
          module_id: 11,
          title: 'Employee Object',
          question: 'Write a function `giveRaise(employee, pct)` that adds `pct` (percent value, e.g. 10 for 10%) raise to `employee.salary` and returns the updated employee object.',
          starter_code: 'function giveRaise(employee, pct) {\n  // Write your code here\n}',
          expected_output: '{"name":"Ravi","salary":1100}',
          test_cases: JSON.stringify([{ input: [{ name: 'Ravi', salary: 1000 }, 10], expected: { name: 'Ravi', salary: 1100 }, funcName: 'giveRaise', type: 'func' }]),
          hints: JSON.stringify(['Multiply salary by (1 + pct / 100).']),
          examples: '```javascript\ngiveRaise({name: "Ravi", salary: 1000}, 10); // returns {name: "Ravi", salary: 1100}\n```',
          difficulty: 'easy',
          order_num: 2
        },
        {
          id: 35,
          module_id: 11,
          title: 'Product Object',
          question: 'Write a function `isInStock(product)` that returns `true` if `product.stock > 0`, and `false` otherwise.',
          starter_code: 'function isInStock(product) {\n  // Write your code here\n}',
          expected_output: 'true',
          test_cases: JSON.stringify([
            { input: [{ title: 'phone', stock: 5 }], expected: true, funcName: 'isInStock', type: 'func' },
            { input: [{ title: 'case', stock: 0 }], expected: false, funcName: 'isInStock', type: 'func' }
          ]),
          hints: JSON.stringify(['Verify stock property comparison.']),
          examples: '```javascript\nisInStock({stock: 5}); // returns true\n```',
          difficulty: 'easy',
          order_num: 3
        },

        // Module 12: DOM Manipulation (IDs 36-38)
        {
          id: 36,
          module_id: 12,
          title: 'Change Heading',
          question: 'Write a function `updateHeading(text)` that takes heading content and returns a simulated DOM element string: `"<h1>" + text + "</h1>"`.',
          starter_code: 'function updateHeading(text) {\n  // Write your code here\n}',
          expected_output: '<h1>Main Title</h1>',
          test_cases: JSON.stringify([{ input: ['Main Title'], expected: '<h1>Main Title</h1>', funcName: 'updateHeading', type: 'func' }]),
          hints: JSON.stringify(['Concatenate HTML tag strings.']),
          examples: '```javascript\nupdateHeading("Main Title"); // returns "<h1>Main Title</h1>"\n```',
          difficulty: 'easy',
          order_num: 1
        },
        {
          id: 37,
          module_id: 12,
          title: 'Add Paragraph',
          question: 'Write a function `generateParagraphs(arr)` that takes an array of strings and returns a HTML string mapping each string into a `<p>` tag.',
          starter_code: 'function generateParagraphs(arr) {\n  // Write your code here\n}',
          expected_output: '<p>A</p><p>B</p>',
          test_cases: JSON.stringify([{ input: [['A', 'B']], expected: '<p>A</p><p>B</p>', funcName: 'generateParagraphs', type: 'func' }]),
          hints: JSON.stringify(['Use map() and join() strings.']),
          examples: '```javascript\ngenerateParagraphs(["A", "B"]); // returns "<p>A</p><p>B</p>"\n```',
          difficulty: 'easy',
          order_num: 2
        },
        {
          id: 38,
          module_id: 12,
          title: 'Remove Element',
          question: 'Write a function `removeItems(arr)` that filters out any objects from the array that have property `removed: true`.',
          starter_code: 'function removeItems(arr) {\n  // Write your code here\n}',
          expected_output: '[{"id":1}]',
          test_cases: JSON.stringify([
            { input: [[{ id: 1, removed: false }, { id: 2, removed: true }]], expected: [{ id: 1, removed: false }], funcName: 'removeItems', type: 'func' }
          ]),
          hints: JSON.stringify(['Use filter() looking for !item.removed.']),
          examples: '```javascript\nremoveItems([{id: 1, removed: false}, {id: 2, removed: true}]); // returns [{id: 1, removed: false}]\n```',
          difficulty: 'easy',
          order_num: 3
        },

        // Module 13: Events (IDs 39-41)
        {
          id: 39,
          module_id: 13,
          title: 'Counter App',
          question: 'Write a function `updateCounter(count, action)` that returns `count + 1` if action is `"INC"`, `count - 1` if action is `"DEC"`, and `count` otherwise.',
          starter_code: 'function updateCounter(count, action) {\n  // Write your code here\n}',
          expected_output: '6',
          test_cases: JSON.stringify([
            { input: [5, 'INC'], expected: 6, funcName: 'updateCounter', type: 'func' },
            { input: [5, 'DEC'], expected: 4, funcName: 'updateCounter', type: 'func' }
          ]),
          hints: JSON.stringify(['Check if action equals "INC" or "DEC".']),
          examples: '```javascript\nupdateCounter(5, "INC"); // returns 6\n```',
          difficulty: 'easy',
          order_num: 1
        },
        {
          id: 40,
          module_id: 13,
          title: 'Character Counter',
          question: 'Write a function `getRemainingChars(text, limit)` that returns the remaining characters count (`limit - text.length`). If remaining count is negative, return `0`.',
          starter_code: 'function getRemainingChars(text, limit) {\n  // Write your code here\n}',
          expected_output: '5',
          test_cases: JSON.stringify([
            { input: ['abc', 8], expected: 5, funcName: 'getRemainingChars', type: 'func' },
            { input: ['abcdef', 5], expected: 0, funcName: 'getRemainingChars', type: 'func' }
          ]),
          hints: JSON.stringify(['Check if length exceeds limit, return 0 or difference.']),
          examples: '```javascript\ngetRemainingChars("abc", 8); // returns 5\n```',
          difficulty: 'easy',
          order_num: 2
        },
        {
          id: 41,
          module_id: 13,
          title: 'Form Validation',
          question: 'Write a function `validatePassword(pass)` that checks if the string `pass` has length >= 8 and contains at least one digit character.',
          starter_code: 'function validatePassword(pass) {\n  // Write your code here\n}',
          expected_output: 'true',
          test_cases: JSON.stringify([
            { input: ['pass1234'], expected: true, funcName: 'validatePassword', type: 'func' },
            { input: ['password'], expected: false, funcName: 'validatePassword', type: 'func' },
            { input: ['123'], expected: false, funcName: 'validatePassword', type: 'func' }
          ]),
          hints: JSON.stringify(['Use regex test(/\\d/) and string length check.']),
          examples: '```javascript\nvalidatePassword("pass1234"); // returns true\n```',
          difficulty: 'medium',
          order_num: 3
        },

        // Module 14: ES6 Features (IDs 42-43)
        {
          id: 42,
          module_id: 14,
          title: 'Profile Generator',
          question: 'Write a function `generateProfile(user)` that destructures `name` and `role` from the user object and returns a template literal summary: `"Name: [name], Role: [role]"`. Default role to `"Learner"`.',
          starter_code: 'function generateProfile(user) {\n  // Write your code here\n}',
          expected_output: 'Name: Honey, Role: Developer',
          test_cases: JSON.stringify([
            { input: [{ name: 'Honey', role: 'Developer' }], expected: 'Name: Honey, Role: Developer', funcName: 'generateProfile', type: 'func' },
            { input: [{ name: 'Suhail' }], expected: 'Name: Suhail, Role: Learner', funcName: 'generateProfile', type: 'func' }
          ]),
          hints: JSON.stringify(['Apply object destructuring and template strings.']),
          examples: '```javascript\ngenerateProfile({name: "Honey", role: "Developer"}); // returns "Name: Honey, Role: Developer"\n```',
          difficulty: 'easy',
          order_num: 1
        },
        {
          id: 43,
          module_id: 14,
          title: 'Data Merge App',
          question: 'Write a function `mergeConfigs(conf1, conf2)` that merges two configuration objects using the spread operator (`...`) and returns the merged object. Values in `conf2` override `conf1`.',
          starter_code: 'function mergeConfigs(conf1, conf2) {\n  // Write your code here\n}',
          expected_output: '{"theme":"dark","mode":"online"}',
          test_cases: JSON.stringify([
            { input: [{ theme: 'light' }, { theme: 'dark', mode: 'online' }], expected: { theme: 'dark', mode: 'online' }, funcName: 'mergeConfigs', type: 'func' }
          ]),
          hints: JSON.stringify(['Use return { ...conf1, ...conf2 };.']),
          examples: '```javascript\nmergeConfigs({theme: "light"}, {theme: "dark"}); // returns {theme: "dark"}\n```',
          difficulty: 'easy',
          order_num: 2
        },

        // Module 15: Advanced JavaScript (IDs 44-45)
        {
          id: 44,
          module_id: 15,
          title: 'Counter Closure',
          question: 'Write a function `createCounter()` that initializes a private count to `0` and returns a function. Every time the returned function is called, it increments and returns the current private count.',
          starter_code: 'function createCounter() {\n  // Write your code here\n}',
          expected_output: '1',
          test_cases: JSON.stringify([
            { input: [], expected: [1, 2, 3], funcName: 'createCounter', type: 'closure' }
          ]),
          hints: JSON.stringify(['Define let count = 0; inside, then return a function that does count++ and returns count.']),
          examples: '```javascript\nconst c = createCounter();\nc(); // returns 1\nc(); // returns 2\n```',
          difficulty: 'medium',
          order_num: 1
        },
        {
          id: 45,
          module_id: 15,
          title: 'Scope Examples',
          question: 'Write a function `shadowTest(x)` that returns the value of a locally shadowed parameter variable. Inside `shadowTest`, declare a block structure containing `let x = 10;`, then return `x` outside the block but inside the function.',
          starter_code: 'function shadowTest(x) {\n  // Write code showing scope shadow\n}',
          expected_output: '5',
          test_cases: JSON.stringify([
            { input: [5], expected: 5, funcName: 'shadowTest', type: 'func' }
          ]),
          hints: JSON.stringify(['The let variable inside the block is scoped to the block, leaving the parameter x unaltered outside the block.']),
          examples: '```javascript\nshadowTest(5); // returns 5\n```',
          difficulty: 'medium',
          order_num: 2
        },

        // Module 16: Asynchronous JavaScript (IDs 46-48)
        {
          id: 46,
          module_id: 16,
          title: 'Countdown Timer',
          question: 'Write a function `startCountdown()` that returns a Promise resolving with the string `"Go!"` immediately.',
          starter_code: 'function startCountdown() {\n  // Write your code here\n}',
          expected_output: 'Go!',
          test_cases: JSON.stringify([
            { input: [], expected: 'Go!', funcName: 'startCountdown', type: 'promise' }
          ]),
          hints: JSON.stringify(['Use return Promise.resolve("Go!").']),
          examples: '```javascript\nstartCountdown().then(res => console.log(res)); // prints "Go!"\n```',
          difficulty: 'medium',
          order_num: 1
        },
        {
          id: 47,
          module_id: 16,
          title: 'Delayed Message',
          question: 'Write a function `delayMsg(msg, ms)` that returns a Promise which resolves to the string `msg` after `ms` milliseconds.',
          starter_code: 'function delayMsg(msg, ms) {\n  // Write your code here\n}',
          expected_output: 'Done',
          test_cases: JSON.stringify([
            { input: ['Done', 10], expected: 'Done', funcName: 'delayMsg', type: 'promise' }
          ]),
          hints: JSON.stringify(['Return new Promise(resolve => setTimeout(() => resolve(msg), ms)).']),
          examples: '```javascript\ndelayMsg("Hello", 100); // resolves "Hello"\n```',
          difficulty: 'medium',
          order_num: 2
        },
        {
          id: 48,
          module_id: 16,
          title: 'Loading Simulation',
          question: 'Write an async function `simulateLoad(status)` that awaits a promise. If status is `"success"`, return `"Loaded"`. If status is `"fail"`, throw an Error with message `"Failed"`.',
          starter_code: 'async function simulateLoad(status) {\n  // Write your code here\n}',
          expected_output: 'Loaded',
          test_cases: JSON.stringify([
            { input: ['success'], expected: 'Loaded', funcName: 'simulateLoad', type: 'promise' },
            { input: ['fail'], expected: 'Failed', funcName: 'simulateLoad', type: 'promise_catch' }
          ]),
          hints: JSON.stringify(['Check status and throw error or return string.']),
          examples: '```javascript\nawait simulateLoad("success"); // returns "Loaded"\n```',
          difficulty: 'medium',
          order_num: 3
        },

        // Module 17: JSON & API (IDs 49-51)
        {
          id: 49,
          module_id: 17,
          title: 'Weather App',
          question: 'Write a function `formatWeather(jsonStr)` that takes a JSON string representing temperature (`{"temp": 32, "city": "Delhi"}`) and returns a forecast string: `"City: Delhi, Temp: 32C"`.',
          starter_code: 'function formatWeather(jsonStr) {\n  // Write your code here\n}',
          expected_output: 'City: Delhi, Temp: 32C',
          test_cases: JSON.stringify([
            { input: ['{"temp":32,"city":"Delhi"}'], expected: 'City: Delhi, Temp: 32C', funcName: 'formatWeather', type: 'func' }
          ]),
          hints: JSON.stringify(['Use JSON.parse() to get properties.']),
          examples: '```javascript\nformatWeather(\'{"temp":32,"city":"Delhi"}\'); // returns "City: Delhi, Temp: 32C"\n```',
          difficulty: 'easy',
          order_num: 1
        },
        {
          id: 50,
          module_id: 17,
          title: 'User Data App',
          question: 'Write a function `serializeUsers(users)` that takes an array of user objects and returns its stringified JSON representation.',
          starter_code: 'function serializeUsers(users) {\n  // Write your code here\n}',
          expected_output: '[{"id":1}]',
          test_cases: JSON.stringify([
            { input: [[{ id: 1 }]], expected: '[{"id":1}]', funcName: 'serializeUsers', type: 'func' }
          ]),
          hints: JSON.stringify(['Use JSON.stringify().']),
          examples: '```javascript\nserializeUsers([{id: 1}]); // returns \'[{"id":1}]\'\n```',
          difficulty: 'easy',
          order_num: 2
        },
        {
          id: 51,
          module_id: 17,
          title: 'Country Info App',
          question: 'Write a function `findCountry(jsonStr, code)` that parses the JSON string representing a countries list (`[{"code": "IN", "name": "India"}]`) and returns the name of the country matching `code`. If not found, return `null`.',
          starter_code: 'function findCountry(jsonStr, code) {\n  // Write your code here\n}',
          expected_output: 'India',
          test_cases: JSON.stringify([
            { input: ['[{"code":"IN","name":"India"},{"code":"US","name":"USA"}]', 'IN'], expected: 'India', funcName: 'findCountry', type: 'func' },
            { input: ['[{"code":"IN","name":"India"}]', 'FR'], expected: null, funcName: 'findCountry', type: 'func' }
          ]),
          hints: JSON.stringify(['Parse array, use find() to locate matching country code.']),
          examples: '```javascript\nfindCountry(\'[{"code":"IN","name":"India"}]\', "IN"); // returns "India"\n```',
          difficulty: 'medium',
          order_num: 3
        },

        // Module 18: Local Storage (IDs 52-54)
        {
          id: 52,
          module_id: 18,
          title: 'Notes App',
          question: 'Write a function `getNotes(storageObj)` that parses and returns a stored notes array from key `"notes"` of mock storage object `storageObj`. If key does not exist or is empty, return an empty array `[]`.',
          starter_code: 'function getNotes(storageObj) {\n  // Write your code here\n}',
          expected_output: '["Note 1"]',
          test_cases: JSON.stringify([
            { input: [{ notes: '["Note 1"]' }], expected: ['Note 1'], funcName: 'getNotes', type: 'func' },
            { input: [{}], expected: [], funcName: 'getNotes', type: 'func' }
          ]),
          hints: JSON.stringify(['Use storageObj.notes, check if exists, and use JSON.parse().']),
          examples: '```javascript\ngetNotes({notes: \'["Note 1"]\'}); // returns ["Note 1"]\n```',
          difficulty: 'medium',
          order_num: 1
        },
        {
          id: 53,
          module_id: 18,
          title: 'To-Do App',
          question: 'Write a function `saveTodos(storageObj, todos)` that serializes the `todos` array and saves it to key `"todos"` of the mock storage object `storageObj`, then returns `storageObj`.',
          starter_code: 'function saveTodos(storageObj, todos) {\n  // Write your code here\n}',
          expected_output: '{"todos":"[\\"buy milk\\"]"}',
          test_cases: JSON.stringify([
            { input: [{}, ['buy milk']], expected: { todos: '["buy milk"]' }, funcName: 'saveTodos', type: 'func' }
          ]),
          hints: JSON.stringify(['Stringify todos, assign to storageObj.todos, return storageObj.']),
          examples: '```javascript\nsaveTodos({}, ["buy milk"]); // returns {todos: \'["buy milk"]\'}\n```',
          difficulty: 'medium',
          order_num: 2
        },
        {
          id: 54,
          module_id: 18,
          title: 'Theme Saver',
          question: 'Write a function `getTheme(storageObj)` that returns the value of key `"theme"` from `storageObj`. If key is not present, default to `"light"`.',
          starter_code: 'function getTheme(storageObj) {\n  // Write your code here\n}',
          expected_output: 'dark',
          test_cases: JSON.stringify([
            { input: [{ theme: 'dark' }], expected: 'dark', funcName: 'getTheme', type: 'func' },
            { input: [{}], expected: 'light', funcName: 'getTheme', type: 'func' }
          ]),
          hints: JSON.stringify(['Check if storageObj.theme exists or return default.']),
          examples: '```javascript\ngetTheme({theme: "dark"}); // returns "dark"\n```',
          difficulty: 'easy',
          order_num: 3
        },

        // Module 19: OOP JavaScript (IDs 55-56)
        {
          id: 55,
          module_id: 19,
          title: 'Student Class',
          question: 'Write a function `checkStudentGrade(name, marks)` that instantiates a student helper. Declare a class `Student` with constructor setting `this.name = name` and `this.marks = marks`. Add a method `isPassing()` returning `true` if marks >= 50, and `false` otherwise. Instantiate the student and return `isPassing()`.',
          starter_code: 'function checkStudentGrade(name, marks) {\n  // Write class and return check\n}',
          expected_output: 'true',
          test_cases: JSON.stringify([
            { input: ['Honey', 75], expected: true, funcName: 'checkStudentGrade', type: 'func' },
            { input: ['Dev', 40], expected: false, funcName: 'checkStudentGrade', type: 'func' }
          ]),
          hints: JSON.stringify(['Define class Student, constructor, isPassing() method, then return new Student(name, marks).isPassing().']),
          examples: '```javascript\ncheckStudentGrade("Honey", 75); // returns true\n```',
          difficulty: 'medium',
          order_num: 1
        },
        {
          id: 56,
          module_id: 19,
          title: 'Library System',
          question: 'Write a function `toggleBookStatus(title, author)` that defines a `Book` class holding `title`, `author`, and `isRead` (initialized to `false`). Add a method `read()` toggling `isRead` to `true`. Create a book, call `read()`, and return the `isRead` property value.',
          starter_code: 'function toggleBookStatus(title, author) {\n  // Write class and return status\n}',
          expected_output: 'true',
          test_cases: JSON.stringify([
            { input: ['JS manual', 'Author X'], expected: true, funcName: 'toggleBookStatus', type: 'func' }
          ]),
          hints: JSON.stringify(['Define constructor and read() method that toggles boolean state.']),
          examples: '```javascript\ntoggleBookStatus("JS", "X"); // returns true\n```',
          difficulty: 'medium',
          order_num: 2
        },

        // Module 20: Error Handling (IDs 57-58)
        {
          id: 57,
          module_id: 20,
          title: 'Form Validation Errors',
          question: 'Write a function `checkUsername(username)` that throws an Error with message `"Too Short"` if `username.length < 3`. Otherwise, return `"Valid"`.',
          starter_code: 'function checkUsername(username) {\n  // Write your code here\n}',
          expected_output: 'Valid',
          test_cases: JSON.stringify([
            { input: ['Hon3y'], expected: 'Valid', funcName: 'checkUsername', type: 'func' },
            { input: ['ab'], expected: 'Too Short', funcName: 'checkUsername', type: 'error' }
          ]),
          hints: JSON.stringify(['Use throw new Error("Too Short") condition.']),
          examples: '```javascript\ncheckUsername("ab"); // throws Error("Too Short")\n```',
          difficulty: 'medium',
          order_num: 1
        },
        {
          id: 58,
          module_id: 20,
          title: 'Custom Error Messages',
          question: 'Write a function `runSafe(fn)` that executes `fn()` inside a try-catch block. If execution succeeds, return the result. If it fails, return the error message string.',
          starter_code: 'function runSafe(fn) {\n  // Write your code here\n}',
          expected_output: 'Error caught',
          test_cases: JSON.stringify([
            { input: ['() => { throw new Error("Error caught"); }'], expected: 'Error caught', funcName: 'runSafe', type: 'func_eval' },
            { input: ['() => 42'], expected: 42, funcName: 'runSafe', type: 'func_eval' }
          ]),
          hints: JSON.stringify(['Wrap fn() execution in try/catch block. In catch, return err.message.']),
          examples: '```javascript\nrunSafe(() => { throw new Error("Fail"); }); // returns "Fail"\n```',
          difficulty: 'medium',
          order_num: 2
        },

        // Module 21: Mini Projects (IDs 59-66)
        {
          id: 59,
          module_id: 21,
          title: 'Calculator App',
          question: 'Write a function `evalExpr(expr)` that parses and evaluates a simple math string containing two positive numbers and a single operator (e.g. `"10 + 20"`, `"5 * 4"`) and returns the correct integer output.',
          starter_code: 'function evalExpr(expr) {\n  // Write your code here\n}',
          expected_output: '30',
          test_cases: JSON.stringify([
            { input: ['10 + 20'], expected: 30, funcName: 'evalExpr', type: 'func' },
            { input: ['6 * 7'], expected: 42, funcName: 'evalExpr', type: 'func' }
          ]),
          hints: JSON.stringify(['Split string by space, convert values to integers, and check operator.']),
          examples: '```javascript\nevalExpr("10 + 20"); // returns 30\n```',
          difficulty: 'easy',
          order_num: 1
        },
        {
          id: 60,
          module_id: 21,
          title: 'Digital Clock',
          question: 'Write a function `formatTime(h, m, s)` that takes hours, minutes, and seconds as integers and returns a padded 24h clock string format: `"HH:MM:SS"`. For example: `formatTime(9, 5, 12)` should return `"09:05:12"`.',
          starter_code: 'function formatTime(h, m, s) {\n  // Write your code here\n}',
          expected_output: '09:05:12',
          test_cases: JSON.stringify([
            { input: [9, 5, 12], expected: '09:05:12', funcName: 'formatTime', type: 'func' },
            { input: [14, 23, 0], expected: '14:23:00', funcName: 'formatTime', type: 'func' }
          ]),
          hints: JSON.stringify(['Use String(val).padStart(2, "0") helper.']),
          examples: '```javascript\nformatTime(9, 5, 12); // returns "09:05:12"\n```',
          difficulty: 'easy',
          order_num: 2
        },
        {
          id: 61,
          module_id: 21,
          title: 'Stopwatch App',
          question: 'Write a function `formatStopwatch(ms)` that takes total milliseconds and returns a formatted stopwatch string `"MM:SS:CC"` where MM is minutes, SS is seconds, and CC is centiseconds (1/100 of a second). Clue: `CC = Math.floor((ms % 1000) / 10)`.',
          starter_code: 'function formatStopwatch(ms) {\n  // Write your code here\n}',
          expected_output: '01:15:20',
          test_cases: JSON.stringify([
            { input: [75200], expected: '01:15:20', funcName: 'formatStopwatch', type: 'func' }
          ]),
          hints: JSON.stringify(['Calculate minutes, remaining seconds, and centiseconds, then pad them to 2 digits.']),
          examples: '```javascript\nformatStopwatch(75200); // returns "01:15:20"\n```',
          difficulty: 'medium',
          order_num: 3
        },
        {
          id: 62,
          module_id: 21,
          title: 'To-Do Manager',
          question: 'Write a function `manageTodos(list, action, item)` that takes a string array `list`, an action string (`"ADD"`, `"REMOVE"`), and a todo item string. If action is `"ADD"`, append `item` and return list. If action is `"REMOVE"`, remove `item` from list and return it.',
          starter_code: 'function manageTodos(list, action, item) {\n  // Write your code here\n}',
          expected_output: '["buy milk"]',
          test_cases: JSON.stringify([
            { input: [[], 'ADD', 'buy milk'], expected: ['buy milk'], funcName: 'manageTodos', type: 'func' },
            { input: [['buy milk', 'run'], 'REMOVE', 'run'], expected: ['buy milk'], funcName: 'manageTodos', type: 'func' }
          ]),
          hints: JSON.stringify(['Use push() for ADD, and filter() or indexOf()/splice() for REMOVE.']),
          examples: '```javascript\nmanageTodos([], "ADD", "buy milk"); // returns ["buy milk"]\n```',
          difficulty: 'medium',
          order_num: 4
        },
        {
          id: 63,
          module_id: 21,
          title: 'Quiz Grading App',
          question: 'Write a function `gradeQuiz(questions, answers)` that takes quiz questions (`[{ id: number, key: string }]`) and user answers (`[{ qId: number, ans: string }]`) and returns total count of correct answers.',
          starter_code: 'function gradeQuiz(questions, answers) {\n  // Write your code here\n}',
          expected_output: '2',
          test_cases: JSON.stringify([
            { 
              input: [
                [{ id: 1, key: 'A' }, { id: 2, key: 'C' }],
                [{ qId: 1, ans: 'A' }, { qId: 2, ans: 'C' }]
              ], 
              expected: 2, 
              funcName: 'gradeQuiz', 
              type: 'func' 
            },
            { 
              input: [
                [{ id: 1, key: 'A' }],
                [{ qId: 1, ans: 'B' }]
              ], 
              expected: 0, 
              funcName: 'gradeQuiz', 
              type: 'func' 
            }
          ]),
          hints: JSON.stringify(['Iterate through user answers, find corresponding question by ID, check if ans === key.']),
          examples: '```javascript\ngradeQuiz([{id: 1, key: "A"}], [{qId: 1, ans: "A"}]); // returns 1\n```',
          difficulty: 'medium',
          order_num: 5
        },
        {
          id: 64,
          module_id: 21,
          title: 'BMI Calculator',
          question: 'Write a function `checkBMI(weight, height)` that calculates BMI (`weight / (height * height)`) and returns category string: `"Underweight"` (BMI < 18.5), `"Normal"` (18.5 <= BMI < 25), and `"Overweight"` (BMI >= 25).',
          starter_code: 'function checkBMI(weight, height) {\n  // Write your code here\n}',
          expected_output: 'Normal',
          test_cases: JSON.stringify([
            { input: [70, 1.75], expected: 'Normal', funcName: 'checkBMI', type: 'func' },
            { input: [50, 1.8], expected: 'Underweight', funcName: 'checkBMI', type: 'func' },
            { input: [90, 1.7], expected: 'Overweight', funcName: 'checkBMI', type: 'func' }
          ]),
          hints: JSON.stringify(['Calculate BMI first, then use if-else thresholds.']),
          examples: '```javascript\ncheckBMI(70, 1.75); // returns "Normal"\n```',
          difficulty: 'easy',
          order_num: 6
        },
        {
          id: 65,
          module_id: 21,
          title: 'Expense Tracker',
          question: 'Write a function `trackExpenses(expenses, category)` that takes an expense array (`[{ amt: number, cat: string }]`) and returns the sum of amounts for the specified category.',
          starter_code: 'function trackExpenses(expenses, category) {\n  // Write your code here\n}',
          expected_output: '120',
          test_cases: JSON.stringify([
            { 
              input: [[{ amt: 100, cat: 'food' }, { amt: 20, cat: 'food' }, { amt: 50, cat: 'fuel' }], 'food'], 
              expected: 120, 
              funcName: 'trackExpenses', 
              type: 'func' 
            }
          ]),
          hints: JSON.stringify(['Filter expenses matching category, then reduce amount.']),
          examples: '```javascript\ntrackExpenses([{amt: 100, cat: "food"}], "food"); // returns 100\n```',
          difficulty: 'easy',
          order_num: 7
        },
        {
          id: 66,
          module_id: 21,
          title: 'Password Generator',
          question: 'Write a function `generatePassword(len, upper, num)` that returns a generated password string of length `len` composed of characters: lowercase letters, uppercase letters (include if `upper === true`), digits (include if `num === true`). Assumes default letters `"abc"`, uppercase `"ABC"`, numbers `"123"`. Return the string.',
          starter_code: 'function generatePassword(len, upper, num) {\n  // Write password generator logic\n}',
          expected_output: 'a1A',
          test_cases: JSON.stringify([
            { input: [3, true, true], expected: 3, funcName: 'generatePassword', type: 'func_length' }
          ]),
          hints: JSON.stringify(['Construct character pool depending on flags, pick random characters up to len.']),
          examples: '```javascript\ngeneratePassword(8, true, true); // returns string length 8\n```',
          difficulty: 'hard',
          order_num: 8
        },

        // Module 22: Advanced Projects (IDs 67-72)
        {
          id: 67,
          module_id: 22,
          title: 'Weather Map System',
          question: 'Write a function `averageTemp(weekly)` that takes a weekly temperature reading object (`{ Mon: number, Tue: number, ... }`) and returns the average temperature value.',
          starter_code: 'function averageTemp(weekly) {\n  // Write your code here\n}',
          expected_output: '30',
          test_cases: JSON.stringify([
            { input: [{ Mon: 28, Tue: 32, Wed: 30 }], expected: 30, funcName: 'averageTemp', type: 'func' }
          ]),
          hints: JSON.stringify(['Fetch values using Object.values(), sum them and divide by length.']),
          examples: '```javascript\naverageTemp({Mon: 28, Tue: 32}); // returns 30\n```',
          difficulty: 'medium',
          order_num: 1
        },
        {
          id: 68,
          module_id: 22,
          title: 'Movie Search Filter',
          question: 'Write a function `searchMovies(movies, query)` that filters a movie titles array by checking if the title contains `query` (case-insensitive) and returns matching movie titles.',
          starter_code: 'function searchMovies(movies, query) {\n  // Write your code here\n}',
          expected_output: '["Interstellar"]',
          test_cases: JSON.stringify([
            { input: [['Inception', 'Interstellar', 'Batman'], 'stellar'], expected: ['Interstellar'], funcName: 'searchMovies', type: 'func' }
          ]),
          hints: JSON.stringify(['Use filter() and includes() with toLowerCase().']),
          examples: '```javascript\nsearchMovies(["Inception"], "cept"); // returns ["Inception"]\n```',
          difficulty: 'medium',
          order_num: 2
        },
        {
          id: 69,
          module_id: 22,
          title: 'E-Commerce Billing',
          question: 'Write a function `calcCartTotal(items, coupon)` that sums item prices (`[{ price: number }]`). If `coupon` is `"SAVE10"`, apply 10% discount. If shipping is required, add flat `$5` shipping fee only if total after discount is < `$50`. Return the final total.',
          starter_code: 'function calcCartTotal(items, coupon) {\n  // Write your code here\n}',
          expected_output: '41',
          test_cases: JSON.stringify([
            { input: [[{ price: 40 }], 'SAVE10'], expected: 41, funcName: 'calcCartTotal', type: 'func' },
            { input: [[{ price: 100 }], 'SAVE10'], expected: 90, funcName: 'calcCartTotal', type: 'func' }
          ]),
          hints: JSON.stringify(['Compute discount, check if < 50, add 5 shipping if true.']),
          examples: '```javascript\ncalcCartTotal([{price: 40}], "SAVE10"); // returns 41\n```',
          difficulty: 'hard',
          order_num: 3
        },
        {
          id: 70,
          module_id: 22,
          title: 'Chat Word Censor',
          question: 'Write a function `cleanMessage(msg, badWords)` that replaces any occurrences of strings in `badWords` array found within `msg` sentence with `"***"`, then returns the clean sentence.',
          starter_code: 'function cleanMessage(msg, badWords) {\n  // Write your code here\n}',
          expected_output: 'Hello *** world',
          test_cases: JSON.stringify([
            { input: ['Hello spam world', ['spam', 'ad']], expected: 'Hello *** world', funcName: 'cleanMessage', type: 'func' }
          ]),
          hints: JSON.stringify(['Iterate through badWords and apply msg.replaceAll(word, "***").']),
          examples: '```javascript\ncleanMessage("Hello spam", ["spam"]); // returns "Hello ***"\n```',
          difficulty: 'medium',
          order_num: 4
        },
        {
          id: 71,
          module_id: 22,
          title: 'Exam Result Assessor',
          question: 'Write a function `checkExamResult(scores, weights)` that takes scores (`{ theory: number, practical: number }`) and weights (`{ theory: number, practical: number }` as decimals summing to 1) and returns weighted grade. If result >= 60, return `"Pass"`, else `"Fail"`. Output value: `Pass` or `Fail`.',
          starter_code: 'function checkExamResult(scores, weights) {\n  // Write your code here\n}',
          expected_output: 'Pass',
          test_cases: JSON.stringify([
            { 
              input: [{ theory: 70, practical: 50 }, { theory: 0.5, practical: 0.5 }], 
              expected: 'Pass', 
              funcName: 'checkExamResult', 
              type: 'func' 
            },
            { 
              input: [{ theory: 50, practical: 40 }, { theory: 0.6, practical: 0.4 }], 
              expected: 'Fail', 
              funcName: 'checkExamResult', 
              type: 'func' 
            }
          ]),
          hints: JSON.stringify(['Compute weighted sum: scores.theory * weights.theory + scores.practical * weights.practical, compare to 60.']),
          examples: '```javascript\ncheckExamResult({theory: 70, practical: 50}, {theory: 0.5, practical: 0.5}); // returns "Pass"\n```',
          difficulty: 'hard',
          order_num: 5
        },
        {
          id: 72,
          module_id: 22,
          title: 'Contact Form Summary',
          question: 'Write a function `generateSummary(contact)` that takes contact details object `{ name, email, msg }` and returns a summary string: `"From: [name] ([email]) - Msg: [msg]"`. If email is missing, return `"Invalid Submission"`.',
          starter_code: 'function generateSummary(contact) {\n  // Write your code here\n}',
          expected_output: 'From: Hon3y (honey@js.com) - Msg: Hello',
          test_cases: JSON.stringify([
            { input: [{ name: 'Hon3y', email: 'honey@js.com', msg: 'Hello' }], expected: 'From: Hon3y (honey@js.com) - Msg: Hello', funcName: 'generateSummary', type: 'func' },
            { input: [{ name: 'Hon3y', msg: 'Hello' }], expected: 'Invalid Submission', funcName: 'generateSummary', type: 'func' }
          ]),
          hints: JSON.stringify(['Check if contact.email is falsy, otherwise return formatted template string.']),
          examples: '```javascript\ngenerateSummary({name: "Hon3y", email: "honey@js.com", msg: "Hello"}); // returns "From: Hon3y (honey@js.com) - Msg: Hello"\n```',
          difficulty: 'easy',
          order_num: 6
        }
      ];

      for (const t of tasksData) {
        await db.execute({
          sql: `INSERT INTO tasks (id, module_id, title, question, starter_code, expected_output, test_cases, hints, examples, difficulty, order_num) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          args: [t.id, t.module_id, t.title, t.question, t.starter_code, t.expected_output, t.test_cases, t.hints, t.examples, t.difficulty, t.order_num]
        });
      }
      console.log('[Database] Seeding tasks complete.');
    }

    // Seed Achievements
    const achCountCheck = await db.execute('SELECT count(*) as count FROM achievements;');
    const achCount = Number(achCountCheck.rows[0].count);
    if (achCount === 0) {
      console.log('[Database] Seeding achievements badges...');
      const achievementsData = [
        { id: 'first_code', name: 'Hello JS World', description: 'Solve your very first programming task.', icon: 'Sparkles', xp_required: 10, badge_color: 'text-emerald-500' },
        { id: 'streak_3', name: 'Consistent Coder', description: 'Achieve a 3-day active learning streak.', icon: 'Flame', xp_required: 200, badge_color: 'text-orange-505' },
        { id: 'xp_1000', name: 'XP Collector', description: 'Earn 1000 total Experience Points.', icon: 'Trophy', xp_required: 1000, badge_color: 'text-yellow-500' },
        { id: 'js_master', name: 'JS Guru', description: 'Complete all syllabus coding tasks successfully.', icon: 'Award', xp_required: 250, badge_color: 'text-purple-500' }
      ];

      for (const a of achievementsData) {
        await db.execute({
          sql: `INSERT INTO achievements (id, name, description, icon, xp_required, badge_color) VALUES (?, ?, ?, ?, ?, ?);`,
          args: [a.id, a.name, a.description, a.icon, a.xp_required, a.badge_color]
        });
      }
      console.log('[Database] Seeding achievements complete.');
    }

    console.log('[Database] Checked tables and verification complete.');
  } catch (err) {
    console.error('[Database] Failed to initialize/seed database schema:', err);
  }
};

export default db;
