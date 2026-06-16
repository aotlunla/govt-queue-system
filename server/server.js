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

// Allowed Origins (Localhost + Production Vercel)
const allowedOrigins = [
  "http://localhost:3000",
  "https://govt-queue-system.vercel.app",
  "https://govt-queue-system-2.vercel.app",
  process.env.ALLOWED_ORIGIN || ""
].filter(Boolean);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: true, // Allow any origin
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// ===============================
// Security Middleware
// ===============================

// ===============================
// Security Middleware
// ===============================

// Enable Pre-Flight for Private Network Access (HTTPS -> HTTP Localhost)
// Must be BEFORE cors() to ensure header is set on preflight
app.use((req, res, next) => {
  if (req.headers["access-control-request-private-network"]) {
    res.setHeader("Access-Control-Allow-Private-Network", "true");
  }
  next();
});

// Define CORS Options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow ALL origins
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Access-Control-Allow-Private-Network"]
};

// CORS Middleware (Must be first)
app.use(cors(corsOptions));
// Handle Preflight explicitly (Use regex to avoid path-to-regexp parsing errors with '*')
app.options(/(.*)/, cors(corsOptions));



// Helmet - Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://challenges.cloudflare.com", "https://mlicense.vercel.app", "http://localhost:5555"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "*", "ws:", "wss:", "https://challenges.cloudflare.com", "https://mlicense.vercel.app", "http://localhost:5555"],
      frameSrc: ["'self'", "https://challenges.cloudflare.com"]
    }
  },
  crossOriginEmbedderPolicy: false
}));






// Rate Limiting - General
// Health Check Endpoint (Bypass Rate Limit but allow CORS)
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date() });
  } catch (err) {
    console.error('❌ Health Check Failed:', err.message);
    res.status(503).json({ status: 'error', message: 'Database connection failed' });
  }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100000, // 100,000 requests per window (High enough to avoid issues)
  message: { error: 'Too many requests, please try again later' }
});

// Rate Limiting - Login (Stricter)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (Fixed typo)
  max: 100000, // 100,000 login attempts (Practically disabled)
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

// 5. External API (Chrome Extension)
const externalRoutes = require('./routes/externalRoutes');
app.use('/api/external', externalRoutes);

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

    // Auto-Migration: Add case_info (JSON) to queues
    await db.query(`ALTER TABLE queues ADD COLUMN IF NOT EXISTS case_info JSON DEFAULT NULL`);
    console.log('✅ Auto-Migration: Checked/Added case_info column.');

    // Auto-Migration: Add Generated Columns for Search (redCase, redYy)
    // Try/Catch for specific index creation to avoid errors if already exists
    try {
      await db.query(`
            ALTER TABLE queues 
            ADD COLUMN IF NOT EXISTS red_case VARCHAR(50) GENERATED ALWAYS AS (json_unquote(json_extract(case_info, '$.redCase'))) VIRTUAL,
            ADD COLUMN IF NOT EXISTS red_yy VARCHAR(50) GENERATED ALWAYS AS (json_unquote(json_extract(case_info, '$.redYy'))) VIRTUAL
        `);
      // Add Index if not exists (MySQL doesn't support IF NOT EXISTS for INDEX directly in all versions, but we catch error)
      await db.query(`CREATE INDEX idx_red_case ON queues(red_case)`);
      await db.query(`CREATE INDEX idx_red_yy ON queues(red_yy)`);
      console.log('✅ Auto-Migration: Added Generated Columns & Indexes for Search.');
    } catch (err) {
      if (err.code !== 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Auto-Migration (Index):', err.message);
      }
    }

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
