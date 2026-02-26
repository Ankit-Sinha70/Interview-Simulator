import express from 'express';
import cors from 'cors';
import interviewRoutes from './routes/interview.routes';
import analyticsRoutes from './routes/analytics.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import subscriptionRoutes from './routes/subscription.routes';
import subscriptionPlanRoutes from './routes/subscriptionPlan.routes';
import { errorMiddleware } from './middlewares/error.middleware';

const app = express();

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        process.env.FRONTEND_URL || '',
        'https://interview-simulator-psi.vercel.app'
    ].filter(Boolean),
    credentials: true,
}));

// Use JSON parser for all routes except Stripe webhook
app.use((req, res, next) => {
    if (req.originalUrl === '/api/subscription/webhook') {
        next();
    } else {
        express.json({ limit: '10mb' })(req, res, next);
    }
});

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/plans', subscriptionPlanRoutes);

// Error handling
app.use(errorMiddleware);

export default app;
