const express = require('express'); // Server entry point
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
dotenv.config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import Routes
const queueRoutes = require('./routes/queueRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const licenseRoutes = require('./routes/licenseRoutes');
const { licenseMiddleware } = require('./middleware/licenseMiddleware');



const app = express();
const server = http.createServer(app);

// Trust proxy - Required for Railway/Vercel/Cloud deployments behind reverse proxy
// This allows express-rate-limit to correctly identify client IPs
app.set('trust proxy', 1);

const allowedOrigin = process.env.ALLOWED_ORIGIN || "http://localhost:3000";

// Setup Socket.io (รองรับ Frontend ที่รัน port 3000)
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// ===============================
// Security Middleware
// ===============================

// Helmet - Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://challenges.cloudflare.com", "https://mlicense.vercel.app", "http://localhost:5555"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", allowedOrigin, "ws:", "wss:", "https://challenges.cloudflare.com", "https://mlicense.vercel.app", "http://localhost:5555"],
      frameSrc: ["'self'", "https://challenges.cloudflare.com"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Rate Limiting - General


// Apply rate limiting
// MOVED RATE LIMITING BELOW CORS

// CORS
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));

// Rate Limiting - General
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 10000, // 15 minutes
  max: 10000, // 2000 requests per window (handles multiple pages polling simultaneously)
  message: { error: 'Too many requests, please try again later' }
});

// Rate Limiting - Login (Stricter)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 10000, // 15 minutes
  max: 10000, // 100 login attempts (Relaxed for Dev)
  message: { error: 'เข้าสู่ระบบผิดพลาดหลายครั้ง กรุณารอ 15 นาที' }
});

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', loginLimiter);

app.use(express.json({ limit: '10mb' })); // รองรับ JSON Payload พร้อม limit

// Inject 'io' เข้าไปใน request เพื่อให้เรียกใช้ใน Route ได้
app.use((req, res, next) => {
  req.io = io;
  next();
});

// 0. License API (must be BEFORE license middleware)
app.use('/api/license', licenseRoutes);

// License Check Middleware (blocks all other API if not licensed)
// app.use(licenseMiddleware); // DISABLED: We use client-side script only now

// 1. API ระบบคิว (กดบัตร, ย้ายสถานะ, หน้าจอจนท.)
app.use('/api/queues', queueRoutes);

// 2. API ระบบ Admin (เพิ่ม/ลบ ประเภทคิว, ฝ่ายงาน)
app.use('/api/admin', adminRoutes);

// 3. API ระบบ Auth (Login, Profile)
app.use('/api/auth', authRoutes);

// 4. Upload routes removed - Logo now uses URL instead of file upload

// =======================
// Socket Connection Event
// =======================
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // (Optional) สามารถเพิ่ม logic รับ event จาก client ได้ที่นี่

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// =======================
// Start Server
// =======================
// =======================
// Start Server
// =======================
const PORT = process.env.PORT || 5000;
const db = require('./config/db'); // Ensure DB connection for migration

async function startServer() {
  try {
    // Auto-Migration: Add turnstile_enabled
    await db.query(`ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS turnstile_enabled BOOLEAN DEFAULT 1`);
    console.log('✅ Auto-Migration: Checked/Added turnstile_enabled column.');
  } catch (err) {
    console.error('⚠️ Auto-Migration Warning:', err.message);
  }

  server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`   - Frontend Access: http://localhost:3000`);
    console.log(`   - API Endpoint:    http://localhost:${PORT}/api`);
  });
}

startServer();
