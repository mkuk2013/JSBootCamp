import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { sendApprovalEmail } from '../utils/mail';

const router = Router();

// GET /api/v1/cron/auto-approve
router.get('/auto-approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET || process.env.JWT_SECRET || 'super_secret_js_bootcamp_key_change_in_production';
    
    // Auth check
    if (process.env.NODE_ENV === 'production') {
      if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== cronSecret) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized cron request. Invalid authorization header token.' }
        });
      }
    }

    // Get pending students
    const pendingStudentsRes = await db.execute("SELECT id, name, email FROM students WHERE status = 'pending' AND role = 'student';");
    const pendingStudents = pendingStudentsRes.rows;

    if (pendingStudents.length === 0) {
      return res.json({
        success: true,
        message: 'No pending student approvals in queue.'
      });
    }

    const approvedStudents: string[] = [];

    for (const student of pendingStudents) {
      const id = student.id as string;
      const name = student.name as string;
      const email = student.email as string;

      // Update status in DB
      await db.execute({
        sql: "UPDATE students SET status = 'approved' WHERE id = ?;",
        args: [id]
      });

      // Send email notification
      await sendApprovalEmail(email, name);
      approvedStudents.push(`${name} <${email}>`);
    }

    res.json({
      success: true,
      message: `Successfully auto-approved ${pendingStudents.length} student registrations.`,
      approved: approvedStudents
    });
  } catch (error) {
    next(error);
  }
});

export default router;
