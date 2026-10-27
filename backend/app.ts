import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './src/routes/authRoutes';
import shopRoutes from './src/routes/shopRoutes';
import billRoutes from './src/routes/billRoutes';
import deliveryRoutes from './src/routes/deliveryRoutes';
import customerRoutes from './src/routes/customerRoutes';
import adminRoutes from './src/routes/adminRoutes';

dotenv.config();

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (e.g. curl, mobile apps)
    if (!origin) return callback(null, true);
    const allowed = [
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /^https:\/\/.*\.netlify\.app$/,
    ];
    if (allowed.some((pattern) => pattern.test(origin))) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Serve uploads statically
app.use('/uploads', express.static('uploads'));

// Routes Placeholder
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', message: 'Bahi Khata API is running' });
});

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

export default app;
