import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_js_bootcamp_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// POST /signup
router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Full Name, Email and Password are required.' }
      });
    }

    // Verify if email exists
    const checkUser = await db.execute({
      sql: 'SELECT * FROM students WHERE email = ?;',
      args: [email]
    });

    if (checkUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { message: 'An account with this email address already exists.' }
      });
    }

    // Hash Password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const userId = `stud_${Date.now()}`;

    // Insert student
    await db.execute({
      sql: `INSERT INTO students (id, name, email, password, status, role, xp, streak) 
            VALUES (?, ?, ?, ?, 'pending', 'student', 0, 0);`,
      args: [userId, name, email, hashedPassword]
    });

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Pending administrator verification.'
    });
  } catch (error) {
    next(error);
  }
});

// POST /login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and Password are required.' }
      });
    }

    // Find student
    const result = await db.execute({
      sql: "SELECT * FROM students WHERE email = ? AND role = 'student';",
      args: [email]
    });

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email address or password.' }
      });
    }

    const student = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, student.password as string);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email address or password.' }
      });
    }

    // Check status
    if (student.status !== 'approved') {
      return res.status(403).json({
        success: false,
        error: { 
          message: student.status === 'pending'
            ? 'Your account registration is currently pending admin approval. You will receive an email confirmation once approved.'
            : 'Your account registration has been rejected by the administrator.'
        }
      });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: student.id, name: student.name, email: student.email, role: student.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.json({
      success: true,
      token,
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        role: student.role,
        xp: student.xp,
        streak: student.streak,
        last_task_id: student.last_task_id
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /admin/login
router.post('/admin/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and Password are required.' }
      });
    }

    // Find admin user
    const result = await db.execute({
      sql: "SELECT * FROM students WHERE email = ? AND role = 'admin';",
      args: [email]
    });

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid admin credentials or role unauthorized.' }
      });
    }

    const admin = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password as string);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid admin credentials.' }
      });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
