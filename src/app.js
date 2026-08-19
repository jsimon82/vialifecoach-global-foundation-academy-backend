import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from "path";
import { FRONTEND_URL } from './config/env.js';

// Routers
import userRouter from './routes/user.routes.js';
import instructorRouter from './routes/instructor.routes.js';
import courseRouter from './routes/course.routes.js';
import enrollementRouter from './routes/enrollement.routes.js';
import authRouter from './routes/auth.routes.js';
import { verifyEmail, resendVerification } from './controllers/auth.controller.js';
import adminRouter from './routes/admin.routes.js';
import quizRouter from './routes/quiz.routes.js';
import supportRouter from './routes/support.routes.js';
import commonApplicationRouter from './routes/commonApplication.routes.js';
import certificateRouter from './routes/certificate.routes.js';
import communityRouter from './routes/community.routes.js';
import analyticsRouter from './routes/analytics.routes.js';
import eventRouter from './routes/event.routes.js';
import coordinatorRouter from './routes/coordinator.routes.js';
import integrationsRouter from './routes/integrations.routes.js';
import publicRegistrationRouter from './routes/publicRegistration.routes.js';
import eventSyncRouter from './routes/eventSync.routes.js';
import registrationStatsRouter from './routes/registrationStats.routes.js';
import testRouter from './routes/test.routes.js';
import { renderCertificateVerificationPage } from './controllers/certificate.controller.js';

// Middlewares
import { errorMiddleware } from './middlewares/error.middleware.js';
import { createRateLimiter } from './middlewares/rateLimiter.middleware.js';

// Database
import { pool, hasDatabaseConfig } from './config/postgres.js';
import { initDatabaseSchema } from './config/initDb.js';

const app = express();
const certificateVerificationLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30,
    message: "Too many certificate verification requests, please slow down."
});

// ======== MIDDLEWARES ========
app.use(cookieParser());
const DEFAULT_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://academy.vialifecoach.org'
];

function normalizeOrigin(value) {
    if (!value) return null;
    const raw = String(value).trim();
    if (!raw) return null;

    try {
        return new URL(raw).origin;
    } catch {
        return raw.replace(/\/$/, '');
    }
}

function splitOrigins(value) {
    if (!value) return [];
    return String(value)
        .split(/[\s,]+/)
        .map(normalizeOrigin)
        .filter(Boolean);
}

const allowedOrigins = new Set([
    ...DEFAULT_ALLOWED_ORIGINS.map(normalizeOrigin).filter(Boolean),
    ...splitOrigins(FRONTEND_URL),
    ...splitOrigins(process.env.FRONTEND_ORIGIN),
    ...splitOrigins(process.env.FRONTEND_URLS)
]);

app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser tools (Postman/curl) that do not send Origin
        if (!origin) return callback(null, true);
        
        // Allow null origin (for development and testing)
        if (origin === 'null') return callback(null, true);
        
        // Check if origin is in allowed list
        if (allowedOrigins.has(origin)) return callback(null, true);
        
        // For development, allow localhost on any port
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);
        
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: "10mb" }));

// Serve uploaded assets
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ======== DATABASE CONNECTION TEST ========
(async () => {
    if (!hasDatabaseConfig) {
        console.warn('Database configuration missing; skipping schema initialization.');
        return;
    }

    try {
        await pool.query('SELECT 1'); // simple test query
        await initDatabaseSchema();
        console.log('Database connection successful');
        console.log('Database schema ready');
    } catch (err) {
        console.error('Database connection failed:', err.message);
    }
})();

// ======== ROUTES ========
// Public verification endpoint (kept here to avoid any auth middleware issues)
app.post('/api/v1/auth/verify-email', verifyEmail);
app.post('/api/v1/auth/resend-verification', resendVerification);

// Registration stats routes (mount first to avoid conflicts)
app.use('/api/v1/registration-stats', registrationStatsRouter);

// Public endpoints (no authentication required)
app.use('/api/v1/public', publicRegistrationRouter);
app.use('/api/v1/sync', eventSyncRouter);

// Test routes (for debugging)
app.use('/api/v1', testRouter);

// Coordinator routes
app.use('/api/v1/coordinator', coordinatorRouter);

// Other routes
app.use('/api/v1', courseRouter);
app.use('/api/v1', userRouter);
app.use('/api/v1', enrollementRouter);
app.use('/api/v1', authRouter);
app.use('/api/v1', instructorRouter);
app.use('/api/v1', quizRouter);
app.use('/api/v1', supportRouter);
app.use('/api/v1', certificateRouter);
app.use('/api/v1', commonApplicationRouter);
app.use('/api/v1', communityRouter);
app.use('/api/v1', analyticsRouter);
app.use('/api/v1', integrationsRouter);
app.use('/api/v1', eventRouter);
app.use('/api/v1', adminRouter);

// Public verification page
app.get('/verify/:certificateId', certificateVerificationLimiter, renderCertificateVerificationPage);

// ======== HEALTH CHECK ========
app.get('/', (req, res) => {
    res.json({
        ok: true,
        service: 'vialifecoach-backend',
        message: 'Backend API is running',
        health: '/api/v1/health',
        apiBase: '/api/v1'
    });
});

app.get('/api/v1/health', (req, res) => {
    res.json({ ok: true, service: 'vialifecoach-backend', time: new Date().toISOString() });
});

// ======== 404 HANDLER ========
app.use((req, res, next) => {
    res.status(404).json({ message: "Route not found" });
});

// ======== ERROR HANDLING MIDDLEWARE ========
app.use(errorMiddleware);

export default app;
