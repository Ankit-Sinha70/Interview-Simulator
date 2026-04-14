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
// Configure CORS with a dynamic origin checker. Accepts exact allowed origins
// and any vercel preview domains (e.g. *.vercel.app). Also trims trailing
// slashes from `FRONTEND_URL` to avoid mismatches.
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    (process.env.FRONTEND_URL || '').replace(/\/$/, ''),
    'https://interview-simulator-psi.vercel.app',
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            // Allow non-browser requests like server-to-server, Postman, etc.
            return callback(null, true);
        }
        const normalized = origin.replace(/\/$/, '');
        const isAllowed = allowedOrigins.includes(normalized) || /\.vercel\.app$/.test(normalized);
        if (isAllowed) return callback(null, true);
        return callback(new Error(`CORS policy: origin not allowed - ${origin}`));
    },
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
