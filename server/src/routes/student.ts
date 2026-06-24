import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import { db } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/authenticate';

const router = Router();

// GET /api/v1/students/leaderboard
router.get('/leaderboard', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await db.execute(`
      SELECT 
        id, 
        name, 
        email, 
        xp, 
        streak, 
        avatar_url,
        status, 
        role,
        (SELECT COUNT(*) FROM students s2 WHERE s2.role = 'student' AND s2.status = 'approved' AND s2.xp > s.xp) + 1 AS rank
      FROM students s 
      WHERE s.role = 'student' AND s.status = 'approved' 
      ORDER BY s.xp DESC;
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/students/profile
router.get('/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized. User context missing.' }
      });
    }

    const result = await db.execute({
      sql: `
        SELECT 
          id, 
          name, 
          email, 
          xp, 
          streak, 
          level,
          avatar_url,
          status, 
          role, 
          created_at,
          last_task_id,
          (SELECT module_id FROM tasks WHERE id = s.last_task_id) AS last_module_id,
          (SELECT COUNT(*) FROM students s2 WHERE s2.role = 'student' AND s2.status = 'approved' AND s2.xp > s.xp) + 1 AS rank
        FROM students s
        WHERE s.id = ?;
      `,
      args: [req.user.id]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Student profile not found.' }
      });
    }

    // Fetch achievements
    const achResult = await db.execute({
      sql: `
        SELECT a.id, a.name, a.description, a.icon, a.badge_color
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = ?;
      `,
      args: [req.user.id]
    });

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        achievements: achResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
});

// Configure upload storage for avatar images
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB Limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpg, jpeg, png, webp) are allowed.'));
  }
});

// PUT /api/v1/students/profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized. User session missing.' }
      });
    }

    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Name and email are required.' }
      });
    }

    // Verify email is not taken by another user
    const emailCheck = await db.execute({
      sql: 'SELECT id FROM students WHERE email = ? AND id != ?;',
      args: [email, userId]
    });

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email address is already in use.' }
      });
    }

    // Update details in DB
    await db.execute({
      sql: 'UPDATE students SET name = ?, email = ? WHERE id = ?;',
      args: [name, email, userId]
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.'
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/students/profile/last-task
router.put('/profile/last-task', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized. User session missing.' }
      });
    }

    const { lastTaskId } = req.body;
    if (lastTaskId === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'lastTaskId is required.' }
      });
    }

    // Update last_task_id in DB
    await db.execute({
      sql: 'UPDATE students SET last_task_id = ? WHERE id = ?;',
      args: [lastTaskId, userId]
    });

    res.json({
      success: true,
      message: 'Last active task updated successfully.'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/students/profile/avatar
router.post('/profile/avatar', authenticate, upload.single('avatar'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized. User session missing.' }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No file uploaded.' }
      });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    // Update avatar_url in DB
    await db.execute({
      sql: 'UPDATE students SET avatar_url = ? WHERE id = ?;',
      args: [avatarUrl, userId]
    });

    res.json({
      success: true,
      message: 'Avatar profile picture updated successfully.',
      avatarUrl
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/students/profile/password
router.put('/profile/password', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized. User session missing.' }
      });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { message: 'Current password and new password are required.' }
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: { message: 'New password must be at least 6 characters long.' }
      });
    }

    // Fetch user profile from DB to get hashed password
    const studentCheck = await db.execute({
      sql: 'SELECT password FROM students WHERE id = ?;',
      args: [userId]
    });

    if (studentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Student profile not found.' }
      });
    }

    const hashedPassword = studentCheck.rows[0].password as string;

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, hashedPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: { message: 'Current password is incorrect.' }
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update DB
    await db.execute({
      sql: 'UPDATE students SET password = ? WHERE id = ?;',
      args: [newHashedPassword, userId]
    });

    res.json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
