const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ==========================================
// 1. จัดการบุคลากร (Personnel)
// ==========================================
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

router.put('/personnel/:id', async (req, res) => {
  const { fullname, nickname } = req.body;
  try {
    await db.query('UPDATE personnel SET fullname=?, nickname=? WHERE id=?', [fullname, nickname, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/personnel/:id', async (req, res) => {
  try {
    await db.query('UPDATE personnel SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 2. จัดการฝ่ายงาน (Departments)
// ==========================================
router.get('/departments', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM departments WHERE is_active = 1 ORDER BY sort_order');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/departments', async (req, res) => {
  const { name, code } = req.body;
  try {
    const [last] = await db.query('SELECT MAX(sort_order) as maxOrder FROM departments');
    const nextOrder = (last[0].maxOrder || 0) + 1;
    const [result] = await db.query('INSERT INTO departments (name, code, sort_order) VALUES (?, ?, ?)', [name, code, nextOrder]);
    res.json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/departments/:id', async (req, res) => {
  const { name, code, sort_order } = req.body;
  try {
    await db.query('UPDATE departments SET name=?, code=?, sort_order=? WHERE id=?', [name, code, sort_order, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    await db.query('UPDATE departments SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 3. จัดการช่องบริการ (Counters)
// ==========================================
router.get('/counters', async (req, res) => {
  const { department_id } = req.query;
  try {
    let sql = 'SELECT * FROM counters WHERE is_active = 1';
    const params = [];
    if (department_id) {
      sql += ' AND department_id = ?';
      params.push(department_id);
    }
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/counters', async (req, res) => {
  const { name, department_id } = req.body;
  try {
    const [result] = await db.query('INSERT INTO counters (name, department_id) VALUES (?, ?)', [name, department_id]);
    res.json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/counters/:id', async (req, res) => {
  try {
    await db.query('UPDATE counters SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 4. จัดการประเภทคิว (Queue Types)
// ==========================================
router.get('/queue-types', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM queue_types WHERE is_active = 1 ORDER BY id');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/queue-types', async (req, res) => {
  const { name, code, badge_color } = req.body;
  try {
    const [result] = await db.query('INSERT INTO queue_types (name, code, badge_color) VALUES (?, ?, ?)', [name, code, badge_color]);
    res.json({ success: true, id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/queue-types/:id', async (req, res) => {
  const { name, code, badge_color } = req.body;
  try {
    await db.query('UPDATE queue_types SET name=?, code=?, badge_color=? WHERE id=?', [name, code, badge_color, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/queue-types/:id', async (req, res) => {
  try {
    await db.query('UPDATE queue_types SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // ตรวจสอบ username และ password จากฐานข้อมูล
    const [rows] = await db.query(
      'SELECT id, username, fullname FROM admin_users WHERE username = ? AND password = ?', 
      [username, password]
    );

    if (rows.length > 0) {
      const user = rows[0];
      // Login สำเร็จ ส่งข้อมูลกลับไป
      res.json({ 
        success: true, 
        admin: { id: user.id, username: user.username, fullname: user.fullname } 
      });
    } else {
      res.status(401).json({ error: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;