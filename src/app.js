import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Routers
import userRouter from './routes/user.routes.js';
import instructorRouter from './routes/instructor.routes.js';
import courseRouter from './routes/course.routes.js';
import enrollementRouter from './routes/enrollement.routes.js';
import authRouter from './routes/auth.routes.js';
import adminRouter from './routes/admin.routes.js';
import quizRouter from './routes/quiz.routes.js';
import supportRouter from './routes/support.routes.js';

// Middlewares
import { errorMiddleware } from './middlewares/error.middleware.js';

// Database
import { pool } from './config/postgres.js';
import { initDatabaseSchema } from './config/initDb.js';

const app = express();

// ======== MIDDLEWARES ========
app.use(cookieParser());
const allowedOrigins = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173'
]);

app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser tools (Postman/curl) that do not send Origin
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ======== DATABASE CONNECTION TEST ========
(async () => {
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
app.use('/api/v1', courseRouter);
app.use('/api/v1', userRouter);
app.use('/api/v1', enrollementRouter);
app.use('/api/v1', authRouter);
app.use('/api/v1', instructorRouter);
app.use('/api/v1', quizRouter);
app.use('/api/v1', supportRouter);
app.use('/api/v1', adminRouter);

// ======== 404 HANDLER ========
app.use((req, res, next) => {
    res.status(404).json({ message: "Route not found" });
});

// ======== ERROR HANDLING MIDDLEWARE ========
app.use(errorMiddleware);

export default app;
