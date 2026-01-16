const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ==========================================
// Helper Function: บันทึกประวัติการทำงาน (Log)
// ==========================================
const addLog = async (queueId, action, details, personnelId) => {
  try {
    await db.query(
      'INSERT INTO queue_logs (queue_id, action_type, action_details, personnel_id) VALUES (?, ?, ?, ?)',
      [queueId, action, details, personnelId || null]
    );
  } catch (err) {
    console.error("❌ Failed to create log:", err.message);
  }
};

// ==========================================
// 1. Config & Master Data (ดึงข้อมูลสำหรับ Dropdown)
// ==========================================
router.get('/config', async (req, res) => {
  try {
    const [types] = await db.query('SELECT * FROM queue_types WHERE is_active = 1');
    const [roles] = await db.query('SELECT * FROM case_roles WHERE is_active = 1');
    const [depts] = await db.query('SELECT * FROM departments WHERE is_active = 1 ORDER BY sort_order');
    const [counters] = await db.query('SELECT * FROM counters WHERE is_active = 1');
    
    res.json({ types, roles, departments: depts, counters });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. ดึงรายการคิว (Dashboard)
// ==========================================
// ตัวอย่าง: GET /api/queues?dept_id=1
router.get('/', async (req, res) => {
  const { dept_id } = req.query;
  try {
    let sql = `
      SELECT q.*, 
             t.name as type_name, r.name as role_name, 
             d.name as dept_name, c.name as counter_name
      FROM queues q
      LEFT JOIN queue_types t ON q.type_id = t.id
      LEFT JOIN case_roles r ON q.role_id = r.id
      LEFT JOIN departments d ON q.current_department_id = d.id
      LEFT JOIN counters c ON q.current_counter_id = c.id
      WHERE q.status != 'COMPLETED' AND q.status != 'CANCELLED'
    `;
    
    const params = [];
    
    // ถ้ามีการระบุแผนก ให้กรองเฉพาะแผนกนั้น
    if (dept_id) {
      sql += ' AND q.current_department_id = ?';
      params.push(dept_id);
    }
    
    sql += ' ORDER BY q.updated_at ASC'; // มาก่อนได้ก่อน

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 3. สร้างคิวใหม่ (Kiosk / Reception)
// ==========================================
router.post('/create', async (req, res) => {
  const { type_id, role_id, personnel_id } = req.body; // รับ personnel_id เพิ่ม
  const io = req.io;

  try {
    // 3.1 หาแผนกแรกสุด (จุดลงรับเอกสาร) เป็นค่าเริ่มต้น
    const [firstDept] = await db.query('SELECT id FROM departments ORDER BY sort_order ASC LIMIT 1');
    const startDeptId = firstDept.length > 0 ? firstDept[0].id : null;

    // 3.2 สร้างเลขคิว (Running Number)
    const [typeRows] = await db.query('SELECT code FROM queue_types WHERE id = ?', [type_id]);
    const typeCode = typeRows[0]?.code || 'Q';
    
    const [countRows] = await db.query(
      `SELECT COUNT(*) as count FROM queues WHERE type_id = ? AND DATE(created_at) = CURDATE()`, 
      [type_id]
    );
    const nextNum = countRows[0].count + 1;
    const queueNumber = `${typeCode}${String(nextNum).padStart(3, '0')}`;

    // 3.3 บันทึกลง Database
    const [result] = await db.query(
      `INSERT INTO queues (queue_number, type_id, role_id, current_department_id, status) 
       VALUES (?, ?, ?, ?, 'WAITING')`,
      [queueNumber, type_id, role_id, startDeptId]
    );

    const newQueueId = result.insertId;
    const newQueue = { id: newQueueId, queue_number: queueNumber };

    // 3.4 บันทึก Log
    await addLog(newQueueId, 'CREATE', `สร้างบัตรคิวใหม่ (${queueNumber})`, personnel_id);
    
    // 3.5 แจ้งเตือน Realtime ไปยังแผนกแรก
    io.emit('queue_update', { dept_id: startDeptId }); 
    
    res.status(201).json(newQueue);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// ==========================================
// 4. ย้ายงาน / ส่งต่องาน (Transfer)
// ==========================================
router.put('/:id/transfer', async (req, res) => {
  const { id } = req.params;
  const { target_dept_id, target_counter_id, status, personnel_id } = req.body; 
  const io = req.io;

  try {
    // 4.1 ดึงข้อมูลเก่าเพื่อเอามาเขียน Log
    const [oldData] = await db.query(
      `SELECT d.name as dept_name FROM queues q 
       LEFT JOIN departments d ON q.current_department_id = d.id 
       WHERE q.id = ?`, 
      [id]
    );
    const oldDeptName = oldData[0]?.dept_name || 'Unknown';

    // 4.2 สร้าง SQL สำหรับอัปเดต
    let sql = 'UPDATE queues SET current_department_id = ?, updated_at = NOW()';
    const params = [target_dept_id];

    if (target_counter_id !== undefined) {
      sql += ', current_counter_id = ?';
      params.push(target_counter_id);
    } else {
        // ถ้าส่งข้ามแผนก ให้เคลียร์ช่องบริการเดิมทิ้ง
        sql += ', current_counter_id = NULL';
    }

    if (status) {
      sql += ', status = ?';
      params.push(status);
    }
    
    sql += ' WHERE id = ?';
    params.push(id);

    // รันคำสั่ง Update
    await db.query(sql, params);

    // 4.3 ดึงชื่อแผนกใหม่เพื่อบันทึก Log
    const [newDeptData] = await db.query('SELECT name FROM departments WHERE id = ?', [target_dept_id]);
    const newDeptName = newDeptData[0]?.name || target_dept_id;

    // 4.4 บันทึก Log
    await addLog(id, 'TRANSFER', `ส่งงาน: ${oldDeptName} -> ${newDeptName}`, personnel_id);

    // 4.5 แจ้งเตือน Realtime (Refresh ทุกจอ)
    io.emit('queue_update', { msg: 'transfer' });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. จบงาน (Complete)
// ==========================================
router.put('/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { personnel_id } = req.body;
  const io = req.io;

  try {
    await db.query("UPDATE queues SET status = 'COMPLETED', updated_at = NOW() WHERE id = ?", [id]);
    
    await addLog(id, 'COMPLETE', 'จบงาน/ให้บริการเสร็จสิ้น', personnel_id);
    
    io.emit('queue_update', { msg: 'completed' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. ดึงรายละเอียดคิว (สำหรับ Tracking/QR)
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM queues WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Queue not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;