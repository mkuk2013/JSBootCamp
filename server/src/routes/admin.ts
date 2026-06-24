import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../config/db';
import { sendApprovalEmail } from '../utils/mail';

const router = Router();

// GET all students
router.get('/students', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await db.execute("SELECT id, name, email, status, role, xp, streak, level, created_at FROM students WHERE role = 'student' ORDER BY created_at DESC;");
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// POST approve all pending students
router.post('/students/approve-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Select all pending students
    const result = await db.execute("SELECT id, name, email FROM students WHERE role = 'student' AND status = 'pending';");
    const pendingStudents = result.rows;

    if (pendingStudents.length === 0) {
      return res.json({
        success: true,
        message: 'No pending student accounts to approve.'
      });
    }

    // Update status to 'approved' for all pending students
    await db.execute("UPDATE students SET status = 'approved' WHERE role = 'student' AND status = 'pending';");

    // Proactively send email approvals in background
    for (const student of pendingStudents) {
      try {
        await sendApprovalEmail(student.email as string, student.name as string);
      } catch (err) {
        console.error(`Failed to send approval email to ${student.email}:`, err);
      }
    }

    res.json({
      success: true,
      message: `Successfully approved all ${pendingStudents.length} pending student accounts.`
    });
  } catch (error) {
    next(error);
  }
});

// UPDATE student status (Approve / Reject)
router.put('/students/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid status value. Must be "pending", "approved", or "rejected".'
        }
      });
    }

    // Verify student exists
    const checkUser = await db.execute({
      sql: 'SELECT * FROM students WHERE id = ?;',
      args: [id]
    });

    if (checkUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Student record not found.'
        }
      });
    }

    const student = checkUser.rows[0];

    // Update DB
    await db.execute({
      sql: 'UPDATE students SET status = ? WHERE id = ?;',
      args: [status, id]
    });

    // Send email on approval
    if (status === 'approved') {
      await sendApprovalEmail(student.email as string, student.name as string);
    }

    res.json({
      success: true,
      message: `Student registration status updated to ${status}.`
    });
  } catch (error) {
    next(error);
  }
});

// UPDATE student password
router.put('/students/:id/password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 6 characters long.' }
      });
    }

    // Verify student exists
    const checkUser = await db.execute({
      sql: 'SELECT * FROM students WHERE id = ?;',
      args: [id]
    });

    if (checkUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Student record not found.' }
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update DB
    await db.execute({
      sql: 'UPDATE students SET password = ? WHERE id = ?;',
      args: [hashedPassword, id]
    });

    res.json({
      success: true,
      message: "Student's login password updated successfully."
    });
  } catch (error) {
    next(error);
  }
});

// DELETE student record and references
router.delete('/students/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Verify student exists
    const checkUser = await db.execute({
      sql: 'SELECT * FROM students WHERE id = ?;',
      args: [id]
    });

    if (checkUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Student record not found.' }
      });
    }

    // Clear child associations to satisfy constraints
    await db.execute({ sql: 'DELETE FROM submissions WHERE user_id = ?;', args: [id] });
    await db.execute({ sql: 'DELETE FROM user_achievements WHERE user_id = ?;', args: [id] });
    await db.execute({ sql: 'DELETE FROM students WHERE id = ?;', args: [id] });

    res.json({
      success: true,
      message: 'Student account and all active progress deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
});

export default router;

