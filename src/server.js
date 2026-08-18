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

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// ============================================
// CORS - COMPLETE FIX FOR NETLIFY
// ============================================
const allowedOrigins = [
  'https://ssfinworld.netlify.app',
  'https://ssfinworld-carhub.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

// CORS middleware - Custom
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow specific origins or all in development
  if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // For testing - allow all (remove in production)
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Expose-Headers', 'Content-Range, X-Content-Range');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================
// Request Logger
// ============================================
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

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
// Root route
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
// Export for Vercel
// ============================================
export default app;