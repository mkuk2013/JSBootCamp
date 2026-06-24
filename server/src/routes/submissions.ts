import { Router, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/authenticate';

const router = Router();

// POST /api/v1/submissions
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized. Student session missing.' }
      });
    }

    const { taskId, code, passed, output, runtimeMs } = req.body;

    if (taskId === undefined || passed === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'taskId and passed status are required.' }
      });
    }

    // Verify task exists
    const taskRes = await db.execute({
      sql: 'SELECT * FROM tasks WHERE id = ?;',
      args: [taskId]
    });

    if (taskRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Task not found.' }
      });
    }

    const task = taskRes.rows[0];

    // Fetch user current progress
    const studentRes = await db.execute({
      sql: 'SELECT xp, streak, level FROM students WHERE id = ?;',
      args: [userId]
    });

    if (studentRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Student profile not found.' }
      });
    }

    const student = studentRes.rows[0];
    let currentXp = Number(student.xp);
    let currentStreak = Number(student.streak);
    let currentLevel = Number(student.level);

    // Safely fetch last_active_at (column may not exist on older DB versions)
    let lastActiveAt: string = '';
    try {
      const lastActiveRes = await db.execute({
        sql: 'SELECT last_active_at FROM students WHERE id = ?;',
        args: [userId]
      });
      if (lastActiveRes.rows.length > 0 && lastActiveRes.rows[0].last_active_at) {
        lastActiveAt = lastActiveRes.rows[0].last_active_at as string;
      }
    } catch (e) {
      // Column does not exist yet - migration will add it on next server restart
      lastActiveAt = '';
    }

    const resultStatus = passed ? 'pass' : 'fail';
    let scoreAwarded = 0;
    const unlockedAchievements: any[] = [];

    if (passed) {
      // Check if this task was already solved by this user
      const duplicateRes = await db.execute({
        sql: "SELECT count(*) as count FROM submissions WHERE user_id = ? AND task_id = ? AND result = 'pass';",
        args: [userId, taskId]
      });

      const isFirstTime = Number(duplicateRes.rows[0].count) === 0;

      if (isFirstTime) {
        // Award XP for solving the task
        const difficultyXp = task.difficulty === 'easy' ? 50 : task.difficulty === 'medium' ? 100 : 150;
        scoreAwarded = difficultyXp;
        currentXp += difficultyXp;

        // Calculate and update Streak
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        let yesterday = '';
        const yesterdayObj = new Date();
        yesterdayObj.setDate(yesterdayObj.getDate() - 1);
        yesterday = yesterdayObj.toISOString().split('T')[0];

        let lastActiveDate = '';
        if (lastActiveAt) {
          lastActiveDate = lastActiveAt.split('T')[0];
        }

        let newStreak = currentStreak;
        if (!lastActiveDate) {
          newStreak = 1;
        } else if (lastActiveDate === today) {
          // Already active today, streak stays the same
        } else if (lastActiveDate === yesterday) {
          newStreak = currentStreak + 1;
        } else {
          // Broken streak
          newStreak = 1;
        }
        currentStreak = newStreak;

        // Update Level boundary: Level is Math.min(10, Math.floor(currentXp / 1000) + 1)
        const newLevel = Math.min(10, Math.floor(currentXp / 1000) + 1);
        currentLevel = newLevel;

        // Update student profile in DB
        try {
          await db.execute({
            sql: 'UPDATE students SET xp = ?, streak = ?, level = ?, last_active_at = CURRENT_TIMESTAMP WHERE id = ?;',
            args: [currentXp, currentStreak, currentLevel, userId]
          });
        } catch (e) {
          // Fallback if last_active_at column is missing
          await db.execute({
            sql: 'UPDATE students SET xp = ?, streak = ?, level = ? WHERE id = ?;',
            args: [currentXp, currentStreak, currentLevel, userId]
          });
        }

        // Achievements verification
        // Get already unlocked achievements
        const unlockedBadgesRes = await db.execute({
          sql: 'SELECT achievement_id FROM user_achievements WHERE user_id = ?;',
          args: [userId]
        });
        const unlockedBadgesSet = new Set(unlockedBadgesRes.rows.map(b => b.achievement_id));

        // Get total solved count
        const solvedCountRes = await db.execute({
          sql: "SELECT count(distinct task_id) as count FROM submissions WHERE user_id = ? AND result = 'pass';",
          args: [userId]
        });
        // Since we just passed, add 1 to count to include current task (or check DB if solved count is live)
        const solvedCount = Number(solvedCountRes.rows[0].count) + 1;

        // Get total tasks count
        const totalTasksRes = await db.execute('SELECT count(*) as count FROM tasks;');
        const totalTasks = Number(totalTasksRes.rows[0].count);

        const achievementsListRes = await db.execute('SELECT * FROM achievements;');
        const achievementsList = achievementsListRes.rows;

        for (const ach of achievementsList) {
          const achId = ach.id as string;
          if (unlockedBadgesSet.has(achId)) continue;

          let shouldUnlock = false;
          if (achId === 'first_code' && solvedCount >= 1) {
            shouldUnlock = true;
          } else if (achId === 'streak_3' && currentStreak >= 3) {
            shouldUnlock = true;
          } else if (achId === 'xp_1000' && currentXp >= 1000) {
            shouldUnlock = true;
          } else if (achId === 'js_master' && solvedCount >= totalTasks && totalTasks > 0) {
            shouldUnlock = true;
          }

          if (shouldUnlock) {
            // Unlock in DB
            await db.execute({
              sql: 'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?);',
              args: [userId, achId]
            });

            // Award badge XP
            const badgeXp = Number(ach.xp_required);
            currentXp += badgeXp;
            
            // Recalculate level after badge award
            currentLevel = Math.min(10, Math.floor(currentXp / 1000) + 1);

            await db.execute({
              sql: 'UPDATE students SET xp = ?, level = ? WHERE id = ?;',
              args: [currentXp, currentLevel, userId]
            });

            unlockedAchievements.push({
              id: ach.id,
              name: ach.name,
              description: ach.description,
              icon: ach.icon,
              badgeColor: ach.badge_color
            });
          }
        }
      }
    }

    // Insert submission log
    await db.execute({
      sql: `INSERT INTO submissions (user_id, task_id, code, result, score, output, runtime_ms) 
            VALUES (?, ?, ?, ?, ?, ?, ?);`,
      args: [userId, taskId, code, resultStatus, scoreAwarded, output || '', runtimeMs || 0]
    });

    res.json({
      success: true,
      pass: passed,
      score: scoreAwarded,
      output: output || '',
      newLevel: currentLevel,
      unlockedAchievements
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/submissions/user (to get user's solved task ids)
router.get('/user', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized.' }
      });
    }

    const result = await db.execute({
      sql: "SELECT distinct task_id FROM submissions WHERE user_id = ? AND result = 'pass';",
      args: [userId]
    });

    const solvedTaskIds = result.rows.map(r => Number(r.task_id));

    res.json({
      success: true,
      data: solvedTaskIds
    });
  } catch (error) {
    next(error);
  }
});

export default router;
