// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ==========================================
// 1. จัดการประเภทคิว (Queue Types) - สำหรับหน้า Kiosk
// ==========================================

// ดึงทั้งหมด (รวมที่ปิดใช้งานด้วย เพื่อให้ Admin เห็น)
router.get('/queue-types', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM queue_types ORDER BY id ASC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// เพิ่มประเภทคิวใหม่
router.post('/queue-types', async (req, res) => {
  const { name, code, badge_color } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO queue_types (name, code, badge_color, is_active) VALUES (?, ?, ?, 1)',
      [name, code, badge_color || '#3B82F6']
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// แก้ไขประเภทคิว
router.put('/queue-types/:id', async (req, res) => {
  const { name, code, badge_color, is_active } = req.body;
  try {
    await db.query(
      'UPDATE queue_types SET name=?, code=?, badge_color=?, is_active=? WHERE id=?',
      [name, code, badge_color, is_active, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ลบประเภทคิว (Soft Delete คือแค่ปิดการใช้งาน)
router.delete('/queue-types/:id', async (req, res) => {
  try {
    await db.query('UPDATE queue_types SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 2. จัดการฝ่ายงาน (Departments) - เพิ่ม/ลบ/แก้ไข ฝ่าย
// ==========================================

// เพิ่มฝ่ายงานใหม่
router.post('/departments', async (req, res) => {
  const { name, code } = req.body;
  try {
    // หา sort_order ตัวถัดไป
    const [last] = await db.query('SELECT MAX(sort_order) as maxOrder FROM departments');
    const nextOrder = (last[0].maxOrder || 0) + 1;

    const [result] = await db.query(
      'INSERT INTO departments (name, code, sort_order) VALUES (?, ?, ?)',
      [name, code, nextOrder]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// (คุณสามารถเพิ่ม PUT/DELETE departments ทำนองเดียวกับ queue-types ได้เลยครับ)

module.exports = router;

router.get('/personnel', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM personnel WHERE is_active = 1 ORDER BY fullname');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/personnel', async (req, res) => {
  const { fullname, nickname } = req.body;
  try {
    const [result] = await db.query('INSERT INTO personnel (fullname, nickname) VALUES (?, ?)', [fullname, nickname]);
    res.json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ลบ (Soft Delete)
router.delete('/personnel/:id', async (req, res) => {
  try {
    await db.query('UPDATE personnel SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;