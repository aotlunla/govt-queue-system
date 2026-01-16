const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

// Import Routes
const queueRoutes = require('./routes/queueRoutes');
const adminRoutes = require('./routes/adminRoutes'); // ส่วนที่เพิ่มใหม่สำหรับ Admin

dotenv.config();

const app = express();
const server = http.createServer(app);

// Setup Socket.io (รองรับ Frontend ที่รัน port 3000)
const io = new Server(server, {
  cors: {
    origin: "*", // อนุญาตทุกการเชื่อมต่อ (หรือระบุ ["http://localhost:3000"] เพื่อความปลอดภัย)
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(cors()); // อนุญาต Cross-Origin Resource Sharing
app.use(express.json()); // รองรับ JSON Payload

// Inject 'io' เข้าไปใน request เพื่อให้เรียกใช้ใน Route ได้
app.use((req, res, next) => {
  req.io = io;
  next();
});

// =======================
// Routes (เส้นทาง API)
// =======================

// 1. API ระบบคิว (กดบัตร, ย้ายสถานะ, หน้าจอจนท.)
app.use('/api/queues', queueRoutes);

// 2. API ระบบ Admin (เพิ่ม/ลบ ประเภทคิว, ฝ่ายงาน)
app.use('/api/admin', adminRoutes);

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
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`   - Frontend Access: http://localhost:3000`);
  console.log(`   - API Endpoint:    http://localhost:${PORT}/api`);
});