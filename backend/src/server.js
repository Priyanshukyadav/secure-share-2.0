import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectMongoDB, disconnectMongoDB } from './config/mongo.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const configuredOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

if (process.env.NODE_ENV !== 'production') {
  configuredOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || configuredOrigins.includes(origin.replace(/\/$/, ''))) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['x-iv', 'x-auth-tag', 'x-share-salt', 'x-file-size', 'Content-Disposition']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Apply API rate limiter to all routes
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters');
  }

  await connectMongoDB();
  const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     End-to-End Encrypted File Sharing System - BACKEND        ║
║                    🔐 Server Running 🔐                       ║
║                                                                ║
║  Server: http://localhost:${PORT}                           ║
║  Database: Connected via MONGO_URI                            ║
║  Environment: ${process.env.NODE_ENV || 'development'}       ║
╚════════════════════════════════════════════════════════════════╝
  `);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectMongoDB();
      process.exit(0);
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
};

startServer().catch((error) => {
  console.error('❌ Server startup failed:', error.message);
  process.exit(1);
});

export default app;
