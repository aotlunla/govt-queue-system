const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

// ==========================================
// PUBLIC ROUTES (No Authentication Required)
// Used by: Kiosk, Display Board, Tracking Page
// ==========================================
// 10.1 Daily Stats (สำหรับ Dashboard Capsule)
// ==========================================
router.get('/stats/dashboard', async (req, res) => {
    try {
        const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'WAITING' THEN 1 ELSE 0 END) as waiting,
        SUM(CASE WHEN status = 'PROCESSING' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled
      FROM queues 
      WHERE DATE(created_at) = CURDATE()
    `);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 10. Stats (สถิติ Dashboard) - MOVED TO TOP
// ==========================================
router.get('/stats/summary', async (req, res) => {
    const { start_date, end_date } = req.query;
    try {
        let dateCondition = '';
        const params = [];

        if (start_date && end_date) {
            dateCondition = 'AND DATE(created_at) BETWEEN ? AND ?';
            params.push(start_date, end_date);
        } else if (start_date) { // If only start_date is provided
            dateCondition = 'AND DATE(created_at) = ?';
            params.push(start_date);
        } else if (end_date) { // If only end_date is provided
            dateCondition = 'AND DATE(created_at) <= ?';
            params.push(end_date);
        } else {
            // Default to current month if no date provided
            dateCondition = 'AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())';
        }

        // 1. Overview Counts
        const [overview] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'WAITING' THEN 1 ELSE 0 END) as waiting,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled
      FROM queues 
      WHERE 1=1 ${dateCondition}
    `, params);

        // 2. By Type
        const [byType] = await db.query(`
      SELECT t.name, COUNT(*) as count
      FROM queues q
      JOIN queue_types t ON q.type_id = t.id
      WHERE 1=1 ${dateCondition}
      GROUP BY t.name, t.sort_order
      ORDER BY t.sort_order
    `, params);

        // 3. By Day (Graph)
        const [byDay] = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM queues
      WHERE 1=1 ${dateCondition}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, params);

        res.json({
            overview: overview[0],
            byType,
            byDay
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 9. History (ประวัติคิว) - MOVED TO TOP
// ==========================================
router.get('/history/all', async (req, res) => {
    const { start_date, end_date } = req.query;
    try {
        let sql = `
      SELECT q.*, 
             t.name as type_name, r.name as role_name,
             d.name as current_dept_name
      FROM queues q
      LEFT JOIN queue_types t ON q.type_id = t.id
      LEFT JOIN case_roles r ON q.role_id = r.id
      LEFT JOIN departments d ON q.current_department_id = d.id
      WHERE 1=1
    `;
        const params = [];

        if (start_date) {
            sql += ' AND DATE(q.created_at) >= ?';
            params.push(start_date);
        }
        if (end_date) {
            sql += ' AND DATE(q.created_at) <= ?';
            params.push(end_date);
        }

        sql += ' ORDER BY q.created_at DESC';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 10.2 Search Queue (ค้นหาคิว)
// ==========================================
router.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    try {
        // Search by queue number (partial match) and ensure it's active (WAITING or PROCESSING)
        // Also allow searching for completed queues if needed, but for now let's prioritize active ones for the dashboard redirect.
        // If we want to redirect to workstation, it implies we want to work on it.
        const [rows] = await db.query(`
            SELECT q.*, d.name as department_name 
            FROM queues q
            LEFT JOIN departments d ON q.current_department_id = d.id
            WHERE q.queue_number LIKE ? 
            AND DATE(q.created_at) = CURDATE()
            AND q.status IN ('WAITING', 'PROCESSING')
            ORDER BY FIELD(q.status, 'PROCESSING', 'WAITING'), q.created_at DESC
            LIMIT 10
        `, [`%${q}%`]);

        // Return empty array instead of 404 for dropdown
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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
        const [types] = await db.query('SELECT * FROM queue_types WHERE is_active = 1 ORDER BY sort_order');
        const [roles] = await db.query('SELECT * FROM case_roles WHERE is_active = 1 ORDER BY sort_order');
        const [depts] = await db.query(`
            SELECT d.*, 
            (SELECT COUNT(*) FROM queues q 
             WHERE q.current_department_id = d.id 
             AND q.status = 'WAITING' 
             AND DATE(q.created_at) = CURDATE()) as waiting_count
            FROM departments d 
            WHERE d.is_active = 1 
            ORDER BY d.sort_order
        `);
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
        // [NEW] Auto-Close Old Queues: PROCESSING → COMPLETED, others → CANCELLED
        const [oldProcessing] = await db.query(`
            SELECT id FROM queues 
            WHERE status = 'PROCESSING' 
            AND DATE(created_at) < CURDATE()
        `);

        const [oldWaiting] = await db.query(`
            SELECT id FROM queues 
            WHERE status = 'WAITING' 
            AND DATE(created_at) < CURDATE()
        `);

        // Auto-complete PROCESSING queues
        if (oldProcessing.length > 0) {
            const ids = oldProcessing.map(q => q.id);
            const ph = ids.map(() => '?').join(',');
            await db.query(`UPDATE queues SET status = 'COMPLETED', updated_at = NOW() WHERE id IN (${ph})`, ids);
            for (const qId of ids) {
                await addLog(qId, 'SYSTEM_COMPLETE', 'จบงานอัตโนมัติโดยระบบ (คิวค้างจากวันก่อน)', null);
            }
        }

        // Auto-cancel WAITING queues
        if (oldWaiting.length > 0) {
            const ids = oldWaiting.map(q => q.id);
            const ph = ids.map(() => '?').join(',');
            await db.query(`UPDATE queues SET status = 'CANCELLED', updated_at = NOW() WHERE id IN (${ph})`, ids);
            for (const qId of ids) {
                await addLog(qId, 'SYSTEM_CANCEL', 'ยกเลิกอัตโนมัติโดยระบบ (คิวค้างจากวันก่อน)', null);
            }
        }

        let sql = `
      SELECT q.*, 
             t.name as type_name, t.badge_color, r.name as role_name, 
             d.name as dept_name, c.name as counter_name,
             (SELECT COUNT(*) FROM queue_logs WHERE queue_id = q.id AND action_type = 'REMARK') as remark_count
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
        // 4.1 หาแผนกแรกสุด (Fallback)
        const [firstDept] = await db.query('SELECT id FROM departments ORDER BY sort_order ASC LIMIT 1');
        const fallbackDeptId = firstDept.length > 0 ? firstDept[0].id : null;

        // 4.2 สร้างเลขคิว & หา Default Department
        const [typeRows] = await db.query('SELECT code, default_department_id FROM queue_types WHERE id = ?', [type_id]);
        const typeCode = typeRows[0]?.code || 'Q';
        const startDeptId = typeRows[0]?.default_department_id || fallbackDeptId;

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
// PUBLIC: Display Board (สำหรับจอแสดงผล)
// ==========================================
router.get('/display/:configId', async (req, res) => {
    const { configId } = req.params;
    try {
        // 1. Get Config (try slug first, then ID)
        let [configs] = await db.query('SELECT * FROM display_configs WHERE slug = ?', [configId]);
        if (configs.length === 0 && !isNaN(configId)) {
            [configs] = await db.query('SELECT * FROM display_configs WHERE id = ?', [configId]);
        }
        if (configs.length === 0) return res.status(404).json({ error: 'Config not found' });

        const config = typeof configs[0].config === 'string'
            ? JSON.parse(configs[0].config)
            : configs[0].config;

        // 2. Build Query
        let sql = `
            SELECT q.*, t.name as type_name, t.badge_color,
                   d.name as dept_name, c.name as counter_name
            FROM queues q
            LEFT JOIN queue_types t ON q.type_id = t.id
            LEFT JOIN departments d ON q.current_department_id = d.id
            LEFT JOIN counters c ON q.current_counter_id = c.id
            WHERE DATE(q.created_at) = CURDATE()
        `;
        const params = [];

        // Filter by Statuses
        if (config.statuses && config.statuses.length > 0) {
            sql += ` AND q.status IN (${config.statuses.map(() => '?').join(',')})`;
            params.push(...config.statuses);
        } else {
            sql += " AND q.status IN ('WAITING', 'PROCESSING')";
        }

        // Filter by Departments
        if (config.departments && config.departments.length > 0) {
            sql += ` AND q.current_department_id IN (${config.departments.map(() => '?').join(',')})`;
            params.push(...config.departments);
        }

        sql += ' ORDER BY q.updated_at DESC';
        const [queues] = await db.query(sql, params);

        res.json({ config: configs[0], queues });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// PUBLIC: Track Queue by Code (YYMMDD+QueueNumber)
// ==========================================
router.get('/track/:code', async (req, res) => {
    const { code } = req.params;

    if (!code || code.length < 7) {
        return res.status(400).json({ error: 'Invalid tracking code' });
    }

    const dateStr = code.substring(0, 6);
    const queueNum = code.substring(6);

    const year = '20' + dateStr.substring(0, 2);
    const month = dateStr.substring(2, 4);
    const day = dateStr.substring(4, 6);
    const trackingDate = `${year}-${month}-${day}`;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (trackingDate !== todayStr) {
        return res.status(404).json({
            error: 'Expired or Invalid Date',
            message: 'ไม่พบข้อมูลคิว หรือรหัสติดตามหมดอายุ'
        });
    }

    try {
        const [queues] = await db.query(`
            SELECT q.*, t.name as type_name, d.name as current_dept_name, 
                   d.status_message, c.name as current_counter_name
            FROM queues q
            LEFT JOIN queue_types t ON q.type_id = t.id
            LEFT JOIN departments d ON q.current_department_id = d.id
            LEFT JOIN counters c ON q.current_counter_id = c.id
            WHERE q.queue_number = ? AND DATE(q.created_at) = ?
        `, [queueNum, trackingDate]);

        if (queues.length === 0) {
            return res.status(404).json({ error: 'Queue not found' });
        }

        const queue = queues[0];

        const [logs] = await db.query(`
            SELECT l.*, p.fullname as staff_name 
            FROM queue_logs l 
            LEFT JOIN personnel p ON l.personnel_id = p.id
            WHERE l.queue_id = ? ORDER BY l.created_at DESC
        `, [queue.id]);

        const [stats] = await db.query(`
            SELECT COUNT(*) as count FROM queues 
            WHERE DATE(created_at) = CURDATE() AND status IN ('WAITING', 'PROCESSING')
        `);

        res.json({ ...queue, logs, remaining_queues: stats[0].count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// PUBLIC: Get Single Queue (For QR/Tracking)
// ==========================================
router.get('/public/:id', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT q.*, t.name as type_name, d.name as dept_name, c.name as counter_name
            FROM queues q
            LEFT JOIN queue_types t ON q.type_id = t.id
            LEFT JOIN departments d ON q.current_department_id = d.id
            LEFT JOIN counters c ON q.current_counter_id = c.id
            WHERE q.id = ?
        `, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Queue not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// PROTECTED ROUTES (Authentication Required)
// Used by: Staff Dashboard, Workstation
// ==========================================
router.use(authMiddleware);

// ==========================================
// 4.1 Call Queue (เรียกคิว)
// ==========================================
router.put('/:id/call', async (req, res) => {
    const { counter_id, personnel_id } = req.body;
    const { id } = req.params;
    const io = req.io;

    try {
        // 1. Get queue's current department
        const [queue] = await db.query('SELECT current_department_id FROM queues WHERE id = ?', [id]);
        if (queue.length === 0) {
            return res.status(404).json({ error: 'Queue not found' });
        }
        const deptId = queue[0].current_department_id;

        // 2. Check if counter belongs to this department
        let validCounterId = null;
        let counterName = null;

        if (counter_id) {
            const [counter] = await db.query(
                'SELECT name FROM counters WHERE id = ? AND department_id = ?',
                [counter_id, deptId]
            );
            if (counter.length > 0) {
                validCounterId = counter_id;
                counterName = counter[0].name;
            }
        }

        // 3. Update Queue
        await db.query(
            `UPDATE queues 
       SET status = 'PROCESSING', current_counter_id = ?, updated_at = NOW() 
       WHERE id = ?`,
            [validCounterId, id]
        );

        // 4. Log & Notify
        const logMsg = counterName ? `เรียกคิวที่ช่อง ${counterName}` : 'เรียกคิว';
        await addLog(id, 'CALL', logMsg, personnel_id);
        io.emit('queue_update', { msg: 'called' });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 4.1.1 Cancel Call (ยกเลิกการเรียก -> กลับไป Waiting)
// ==========================================
router.put('/:id/cancel-call', async (req, res) => {
    const { personnel_id } = req.body;
    const { id } = req.params;
    const io = req.io;

    try {
        // Update Queue: Status -> WAITING, Clear Counter
        await db.query(
            `UPDATE queues 
       SET status = 'WAITING', current_counter_id = NULL, updated_at = NOW() 
       WHERE id = ?`,
            [id]
        );

        // Log & Notify
        await addLog(id, 'CANCEL_CALL', 'ยกเลิกการเรียก (Undo)', personnel_id);
        io.emit('queue_update', { msg: 'call_cancelled' });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 4.2 Bulk Call Queue (เรียกคิวหลายรายการ)
// ==========================================
router.put('/call-bulk', async (req, res) => {
    const { queue_ids, counter_id, personnel_id } = req.body;
    const io = req.io;

    if (!queue_ids || queue_ids.length === 0) return res.status(400).json({ error: 'No queues selected' });

    try {
        // 1. Get Counter Name
        const [counter] = await db.query('SELECT name FROM counters WHERE id = ?', [counter_id]);
        if (counter.length === 0) return res.status(400).json({ error: 'Invalid Counter ID' });
        const counterName = counter[0]?.name || '-';

        // 2. Update Queues
        const placeholders = queue_ids.map(() => '?').join(',');
        await db.query(
            `UPDATE queues 
       SET status = 'PROCESSING', current_counter_id = ?, updated_at = NOW() 
       WHERE id IN (${placeholders})`,
            [counter_id, ...queue_ids]
        );

        // 3. Log & Notify
        for (const qId of queue_ids) {
            await addLog(qId, 'BULK_CALL', `เรียกคิว (Bulk) ที่ช่อง ${counterName}`, personnel_id);
        }

        io.emit('queue_update', { msg: 'bulk_called' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
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

        // Use parameterized query
        const placeholders = queue_ids.map(() => '?').join(',');

        // Update ทีเดียว
        await db.query(
            `UPDATE queues 
       SET current_department_id = ?, current_counter_id = NULL, updated_at = NOW(), status = 'WAITING' 
       WHERE id IN (${placeholders})`,
            [target_dept_id, ...queue_ids]
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
// 7.1 Cancel (ยกเลิก/ไม่มา)
// ==========================================
router.put('/:id/cancel', async (req, res) => {
    const { personnel_id } = req.body;
    const io = req.io;
    try {
        await db.query("UPDATE queues SET status = 'CANCELLED', updated_at = NOW() WHERE id = ?", [req.params.id]);
        await addLog(req.params.id, 'CANCEL', 'ยกเลิก/ไม่มา', personnel_id);

        io.emit('queue_update', { msg: 'cancelled' });
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

// ==========================================
// 8.2 Add Remark
// ==========================================
router.post('/:id/remark', async (req, res) => {
    const { remark, personnel_id } = req.body;
    const { id } = req.params;

    if (!remark) return res.status(400).json({ error: 'Remark is required' });

    try {
        await addLog(id, 'REMARK', remark, personnel_id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 7.2 Bulk Complete (จบงานหลายรายการ)
// ==========================================
router.put('/complete-bulk', async (req, res) => {
    const { queue_ids, personnel_id } = req.body;
    const io = req.io;

    if (!queue_ids || queue_ids.length === 0) return res.status(400).json({ error: 'No queues selected' });

    try {
        const placeholders = queue_ids.map(() => '?').join(',');
        await db.query(
            `UPDATE queues SET status = 'COMPLETED', updated_at = NOW() WHERE id IN (${placeholders})`,
            queue_ids
        );

        for (const qId of queue_ids) {
            await addLog(qId, 'BULK_COMPLETE', 'จบงาน (Bulk)', personnel_id);
        }

        io.emit('queue_update', { msg: 'bulk_completed' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 7.3 Bulk Cancel (ยกเลิกหลายรายการ)
// ==========================================
router.put('/cancel-bulk', async (req, res) => {
    const { queue_ids, personnel_id } = req.body;
    const io = req.io;

    if (!queue_ids || queue_ids.length === 0) return res.status(400).json({ error: 'No queues selected' });

    try {
        const placeholders = queue_ids.map(() => '?').join(',');
        await db.query(
            `UPDATE queues SET status = 'CANCELLED', updated_at = NOW() WHERE id IN (${placeholders})`,
            queue_ids
        );

        for (const qId of queue_ids) {
            await addLog(qId, 'BULK_CANCEL', 'ยกเลิก/ไม่มา (Bulk)', personnel_id);
        }

        io.emit('queue_update', { msg: 'bulk_cancelled' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 4.5 Print Queue (สั่งพิมพ์บัตรคิว)
// ==========================================
router.post('/print', async (req, res) => {
    const { queue } = req.body;
    try {
        // TODO: Implement actual server-side printing here (e.g., using node-printer or ESC/POS)
        console.log("🖨️ Printing Queue:", queue);
        res.json({ success: true, message: 'Print job received' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 8.3 Delete Log (ลบ Log/Remark)
// ==========================================
router.delete('/logs/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM queue_logs WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
