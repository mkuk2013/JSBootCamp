import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../config/db';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// GET /api/v1/curriculum/levels
router.get('/levels', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const levelsRes = await db.execute('SELECT * FROM levels ORDER BY order_num ASC;');
    const modulesRes = await db.execute('SELECT * FROM modules ORDER BY order_num ASC;');
    const tasksRes = await db.execute('SELECT id, module_id, title, difficulty, order_num FROM tasks ORDER BY order_num ASC;');

    const levels = levelsRes.rows.map(level => {
      const levelModules = modulesRes.rows
        .filter(m => m.level_id === level.id)
        .map(mod => {
          const moduleTasks = tasksRes.rows.filter(t => t.module_id === mod.id);
          return {
            id: mod.id,
            levelId: mod.level_id,
            title: mod.title,
            content: mod.content,
            orderNum: mod.order_num,
            tasks: moduleTasks.map(t => ({
              id: t.id,
              moduleId: t.module_id,
              title: t.title,
              difficulty: t.difficulty,
              orderNum: t.order_num
            }))
          };
        });

      return {
        id: level.id,
        title: level.title,
        description: level.description,
        orderNum: level.order_num,
        modules: levelModules
      };
    });

    res.json({
      success: true,
      data: levels
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/curriculum/modules/:moduleId
router.get('/modules/:moduleId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { moduleId } = req.params;

    const moduleRes = await db.execute({
      sql: 'SELECT * FROM modules WHERE id = ?;',
      args: [moduleId]
    });

    if (moduleRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Module not found.' }
      });
    }

    const tasksRes = await db.execute({
      sql: 'SELECT id, title, question, starter_code, expected_output, test_cases, hints, examples, difficulty, order_num FROM tasks WHERE module_id = ? ORDER BY order_num ASC;',
      args: [moduleId]
    });

    const tasks = tasksRes.rows.map(t => ({
      id: t.id,
      title: t.title,
      question: t.question,
      starterCode: t.starter_code,
      expectedOutput: t.expected_output,
      testCases: t.test_cases ? JSON.parse(t.test_cases as string) : [],
      hints: t.hints ? JSON.parse(t.hints as string) : [],
      examples: t.examples,
      difficulty: t.difficulty,
      orderNum: t.order_num
    }));

    res.json({
      success: true,
      data: {
        id: moduleRes.rows[0].id,
        levelId: moduleRes.rows[0].level_id,
        title: moduleRes.rows[0].title,
        content: moduleRes.rows[0].content,
        orderNum: moduleRes.rows[0].order_num,
        tasks
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/curriculum/tasks/:taskId
router.get('/tasks/:taskId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;

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

    const t = taskRes.rows[0];
    const task = {
      id: t.id,
      moduleId: t.module_id,
      title: t.title,
      question: t.question,
      starterCode: t.starter_code,
      expectedOutput: t.expected_output,
      testCases: t.test_cases ? JSON.parse(t.test_cases as string) : [],
      hints: t.hints ? JSON.parse(t.hints as string) : [],
      examples: t.examples,
      difficulty: t.difficulty,
      orderNum: t.order_num
    };

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
});

export default router;
