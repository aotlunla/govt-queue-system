const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ==========================================
// Helper Function: บันทึก Log ลง Database
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
// 1. Config (ดึงข้อมูลตัวเลือกต่างๆ)
// ==========================================
router.get('/config', async (req, res) => {
  try {
    const [types] = await db.query('SELECT * FROM queue_types WHERE is_active = 1');
    const [roles] = await db.query('SELECT * FROM case_roles WHERE is_active = 1');
    const [depts] = await db.query('SELECT * FROM departments WHERE is_active = 1 ORDER BY sort_order');
    const [counters] = await db.query('SELECT * FROM counters WHERE is_active = 1');
    
    res.json({ types, roles, departments: depts, counters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. Dashboard List (ดึงคิวที่ยังไม่จบ)
// ==========================================
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
// 3. Queue History Logs (สำหรับ Timeline) ⭐ สำคัญ
// ==========================================
router.get('/:id/logs', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.*, p.fullname as staff_name 
      FROM queue_logs l 
      LEFT JOIN personnel p ON l.personnel_id = p.id
      WHERE l.queue_id = ? 
      ORDER BY l.created_at DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. Create Queue (สร้างคิวใหม่)
// ==========================================
router.post('/create', async (req, res) => {
  const { type_id, role_id, personnel_id } = req.body;
  const io = req.io;

  try {
    // 4.1 หาแผนกแรกสุด
    const [firstDept] = await db.query('SELECT id FROM departments ORDER BY sort_order ASC LIMIT 1');
    const startDeptId = firstDept.length > 0 ? firstDept[0].id : null;

    // 4.2 สร้างเลขคิว
    const [typeRows] = await db.query('SELECT code FROM queue_types WHERE id = ?', [type_id]);
    const typeCode = typeRows[0]?.code || 'Q';
    
    const [countRows] = await db.query(
      `SELECT COUNT(*) as count FROM queues WHERE type_id = ? AND DATE(created_at) = CURDATE()`, 
      [type_id]
    );
    const nextNum = countRows[0].count + 1;
    const queueNumber = `${typeCode}${String(nextNum).padStart(3, '0')}`;

    // 4.3 Insert
    const [result] = await db.query(
      `INSERT INTO queues (queue_number, type_id, role_id, current_department_id, status) 
       VALUES (?, ?, ?, ?, 'WAITING')`,
      [queueNumber, type_id, role_id, startDeptId]
    );

    const newQueueId = result.insertId;
    
    // 4.4 Log & Notify
    await addLog(newQueueId, 'CREATE', `ออกบัตรคิว ${queueNumber}`, personnel_id);
    io.emit('queue_update', { dept_id: startDeptId }); 
    
    res.status(201).json({ id: newQueueId, queue_number: queueNumber });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// ==========================================
// 5. Single Transfer (ส่งงาน 1 รายการ)
// ==========================================
router.put('/:id/transfer', async (req, res) => {
  const { target_dept_id, target_counter_id, status, personnel_id } = req.body; 
  const { id } = req.params;
  const io = req.io;

  try {
    // 5.1 หาชื่อแผนกเก่า/ใหม่ เพื่อบันทึก Log
    const [oldQ] = await db.query(`
        SELECT d.name FROM queues q LEFT JOIN departments d ON q.current_department_id = d.id WHERE q.id = ?
    `, [id]);
    const oldDeptName = oldQ[0]?.name || 'จุดเดิม';

    const [newD] = await db.query('SELECT name FROM departments WHERE id = ?', [target_dept_id]);
    const newDeptName = newD[0]?.name || 'จุดใหม่';

    // 5.2 Update SQL
    let sql = 'UPDATE queues SET current_department_id = ?, updated_at = NOW()';
    const params = [target_dept_id];

    if (target_counter_id !== undefined) {
      sql += ', current_counter_id = ?';
      params.push(target_counter_id);
    } else {
      // ย้ายแผนก -> เคลียร์ช่องบริการ
      sql += ', current_counter_id = NULL';
    }

    if (status) {
      sql += ', status = ?';
      params.push(status);
    }
    
    sql += ' WHERE id = ?';
    params.push(id);

    await db.query(sql, params);

    // 5.3 Log & Notify
    await addLog(id, 'TRANSFER', `ส่งงาน: ${oldDeptName} -> ${newDeptName}`, personnel_id);
    io.emit('queue_update', { msg: 'transfer' });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. Bulk Transfer (ส่งงานเป็นชุด)
// ==========================================
router.post('/transfer-bulk', async (req, res) => {
  const { queue_ids, target_dept_id, personnel_id } = req.body;
  const io = req.io;

  if (!queue_ids || queue_ids.length === 0) return res.status(400).json({ error: 'No queues selected' });

  try {
    const [dept] = await db.query('SELECT name FROM departments WHERE id = ?', [target_dept_id]);
    const targetName = dept[0]?.name || target_dept_id;

    // แปลง array เป็น string "1,2,3"
    const idsString = queue_ids.join(','); 
    
    // Update ทีเดียว
    await db.query(
      `UPDATE queues 
       SET current_department_id = ?, current_counter_id = NULL, updated_at = NOW(), status = 'WAITING' 
       WHERE id IN (${idsString})`,
      [target_dept_id]
    );

    // วนลูปบันทึก Log รายตัว
    for (const qId of queue_ids) {
      await addLog(qId, 'BULK_TRANSFER', `ย้ายกลุ่มไปยัง ${targetName}`, personnel_id);
    }

    io.emit('queue_update', { msg: 'bulk_transfer' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. Complete (จบงาน)
// ==========================================
router.put('/:id/complete', async (req, res) => {
  const { personnel_id } = req.body;
  const io = req.io;
  try {
    await db.query("UPDATE queues SET status = 'COMPLETED', updated_at = NOW() WHERE id = ?", [req.params.id]);
    await addLog(req.params.id, 'COMPLETE', 'จบงาน', personnel_id);
    
    io.emit('queue_update', { msg: 'completed' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. Get Single Queue (For QR/Tracking)
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