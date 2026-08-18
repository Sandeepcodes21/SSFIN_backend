import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import carRoutes from './routes/cars.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// ============================================
// CORS - Allow all origins
// ============================================
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================
// Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);

// ============================================
// Health Check
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: process.env.MONGODB_URI ? '✅ configured' : '❌ not configured'
  });
});

// ============================================
// Root route - For testing
// ============================================
app.get('/', (req, res) => {
  res.json({
    message: 'SSFINWORLD CarHub API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      cars: '/api/cars'
    }
  });
});

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

// ============================================
// Error Handler
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

// ============================================
// Connect to MongoDB
// ============================================
if (process.env.MONGODB_URI) {
  connectDB();
}

// ============================================
// Export for Vercel (IMPORTANT!)
// ============================================
export default app;