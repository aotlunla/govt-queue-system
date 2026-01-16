// routes/queueRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. ดึงประเภทคิวและ Role (สำหรับแสดงหน้าตู้กดบัตร)
router.get('/config', async (req, res) => {
  try {
    const [types] = await db.query('SELECT * FROM queue_types WHERE is_active = 1');
    const [roles] = await db.query('SELECT * FROM case_roles WHERE is_active = 1');
    res.json({ types, roles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. สร้างคิวใหม่ (กดบัตรคิว)
router.post('/create', async (req, res) => {
  const { type_id, role_id } = req.body;
  const io = req.io; // เรียกใช้ Socket.io

  try {
    // A. ดึง Code ของ Type (เช่น 'A')
    const [typeRows] = await db.query('SELECT code FROM queue_types WHERE id = ?', [type_id]);
    if (typeRows.length === 0) return res.status(400).json({ error: 'Invalid Type' });
    const typeCode = typeRows[0].code;

    // B. รันเลขคิว (นับจำนวนคิวของวันนี้ + 1)
    // หมายเหตุ: Query นี้ reset เลขทุกวันแบบง่ายๆ
    const [countRows] = await db.query(
      `SELECT COUNT(*) as count FROM queues 
       WHERE type_id = ? AND DATE(created_at) = CURDATE()`, 
      [type_id]
    );
    const nextNum = countRows[0].count + 1;
    const queueNumber = `${typeCode}${String(nextNum).padStart(3, '0')}`; // เช่น A001

    // C. บันทึกลง DB
    const [result] = await db.query(
      `INSERT INTO queues (queue_number, type_id, role_id, status_id) 
       VALUES (?, ?, ?, 'ISSUED')`,
      [queueNumber, type_id, role_id]
    );

    const newQueueId = result.insertId;

    // D. ส่ง Realtime Signal บอกทุกหน้าจอว่า "มีคิวใหม่มาแล้ว!"
    const newQueueData = { id: newQueueId, queue_number: queueNumber, status_id: 'ISSUED' };
    io.emit('queue_update', newQueueData); 

    res.status(201).json(newQueueData);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;