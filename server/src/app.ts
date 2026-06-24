import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import errorHandler from './middleware/errorHandler';
import { testDbConnection, initializeDatabase } from './config/db';
import adminRouter from './routes/admin';
import authRouter from './routes/auth';
import studentRouter from './routes/student';
import curriculumRouter from './routes/curriculum';
import submissionsRouter from './routes/submissions';
import aiRouter from './routes/ai';
import cronRouter from './routes/cron';

// Load variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));

// Compression and Logging
app.use(compression());
app.use(morgan('dev'));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 5000, // Raise limit to 5000 in development
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again after 15 minutes.',
      statusCode: 429
    }
  }
});
app.use('/api/', limiter);

// API Health Check and Base Routes
app.get('/api/v1/health', async (req: Request, res: Response, next: NextFunction) => {
  const dbConnected = await testDbConnection();
  res.status(dbConnected ? 200 : 500).json({
    success: true,
    status: 'UP',
    database: dbConnected ? 'CONNECTED' : 'DISCONNECTED',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/students', studentRouter);
app.use('/api/v1/curriculum', curriculumRouter);
app.use('/api/v1/submissions', submissionsRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/cron', cronRouter);

app.get(['/favicon.ico', '/favicon.png', '/favicon.svg'], (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../favicon.png'));
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to the JS Bootcamp LMS REST API API.',
    documentation: 'Syllabus and Auth endpoints will be extended here.'
  });
});

// Centralized error handling
app.use(errorHandler);

// Start Server
app.listen(PORT, async () => {
  console.log(`[Server] running on http://localhost:${PORT}`);
  // Initialize and seed database tables
  await initializeDatabase();
});

export default app;
