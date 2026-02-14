const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Whitelist of allowed tables for sort order swap (prevents SQL injection)
const ALLOWED_SORT_TABLES = ['departments', 'counters', 'queue_types', 'case_roles'];

// Helper: Handle Sort Order Swap on Duplicate
async function handleSortOrderSwap(tableName, id, newSortOrder) {
  // Validate table name against whitelist (SQL injection prevention)
  if (!ALLOWED_SORT_TABLES.includes(tableName)) {
    throw new Error('Invalid table name');
  }

  // 1. Get current sort_order
  const [current] = await db.query(`SELECT sort_order FROM ${tableName} WHERE id = ?`, [id]);
  if (current.length === 0) return;
  const oldSortOrder = current[0].sort_order;

  // 2. Check for collision
  const [conflict] = await db.query(`SELECT id FROM ${tableName} WHERE sort_order = ? AND id != ?`, [newSortOrder, id]);

  if (conflict.length > 0) {
    const conflictId = conflict[0].id;
    console.log(`[Swap] Conflict in ${tableName}: ID ${id} wants ${newSortOrder}, but ID ${conflictId} has it. Swapping ID ${conflictId} to ${oldSortOrder}.`);

    // 3. Swap: Update conflicting item to oldSortOrder
    await db.query(`UPDATE ${tableName} SET sort_order = ? WHERE id = ?`, [oldSortOrder, conflictId]);
  }
}

// ==========================================
// PUBLIC ROUTES (No Authentication Required)
// Used by: Login Page, Footer, Public Display
// ==========================================

// GET /personnel (Public - for login dropdown)
router.get('/personnel', async (req, res) => {
  try {
    // Only return minimal public info for login selection
    const [rows] = await db.query('SELECT id, fullname, nickname, username FROM personnel WHERE is_active = 1 ORDER BY fullname');
    res.json(rows);
  } catch (err) { console.error('Admin Route Error:', err); res.status(500).json({ error: err.message }); }
});

// GET /settings (Public - for footer, display)
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT agency_name, logo_url, footer_text, announcement_text, announcement_active, announcement_start, announcement_end, kiosk_settings, turnstile_site_key, turnstile_enabled FROM system_settings LIMIT 1');
    const result = rows[0] || {};
    // Default turnstile_enabled to true if undefined (for old records before migration script runs fully)
    if (result.turnstile_enabled === undefined || result.turnstile_enabled === null) result.turnstile_enabled = 1;

    // Parse kiosk_settings if it's a string
    if (result.kiosk_settings && typeof result.kiosk_settings === 'string') {
      result.kiosk_settings = JSON.parse(result.kiosk_settings);
    }
    res.json(result);
  } catch (err) {
    console.error('Admin Route Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /kiosk-settings (Public - for Kiosk page)
router.get('/kiosk-settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT kiosk_settings FROM system_settings LIMIT 1');
    let settings = rows[0]?.kiosk_settings || null;
    if (settings && typeof settings === 'string') {
      settings = JSON.parse(settings);
    }
    res.json(settings || {
      title_type: 'กรุณาเลือกประเภทบริการ',
      title_role: 'กรุณาระบุสถานะของผู้ติดต่อ',
      card_size: 'auto',
      icon_size: 'auto',
      font_size: 'auto',
      primary_color: '#e72289'
    });
  } catch (err) {
    console.error('Admin Route Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PROTECTED ROUTES (Authentication Required)
// ==========================================
router.use(authMiddleware);

// GET /system-settings (Protected - for Admin Settings page)
router.get('/system-settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM system_settings LIMIT 1');
    const result = rows[0] || {};
    if (result.kiosk_settings && typeof result.kiosk_settings === 'string') {
      result.kiosk_settings = JSON.parse(result.kiosk_settings);
    }
    res.json(result);
  } catch (err) {
    console.error('Admin Route Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 1. Personnel (Protected - Create/Update/Delete)
// ==========================================
// ... (existing personnel routes)

// ...

// PUT /settings (Protected - requires auth)
router.put('/settings', async (req, res) => {
  const {
    agency_name, announcement_text, announcement_start, announcement_end, announcement_active,
    overdue_alert_minutes, logo_url, footer_text,
    turnstile_site_key, turnstile_secret_key, turnstile_enabled
  } = req.body;

  try {
    const [rows] = await db.query('SELECT id FROM system_settings LIMIT 1');
    if (rows.length > 0) {
      await db.query(
        'UPDATE system_settings SET agency_name=?, announcement_text=?, announcement_start=?, announcement_end=?, announcement_active=?, overdue_alert_minutes=?, logo_url=?, footer_text=?, turnstile_site_key=?, turnstile_secret_key=?, turnstile_enabled=?, updated_at=NOW() WHERE id=?',
        [agency_name, announcement_text, announcement_start, announcement_end, announcement_active, overdue_alert_minutes, logo_url || null, footer_text || null, turnstile_site_key || null, turnstile_secret_key || null, turnstile_enabled === undefined ? 1 : turnstile_enabled, rows[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO system_settings (agency_name, announcement_text, announcement_start, announcement_end, announcement_active, overdue_alert_minutes, logo_url, footer_text, turnstile_site_key, turnstile_secret_key, turnstile_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [agency_name, announcement_text, announcement_start, announcement_end, announcement_active, overdue_alert_minutes, logo_url || null, footer_text || null, turnstile_site_key || null, turnstile_secret_key || null, turnstile_enabled === undefined ? 1 : turnstile_enabled]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Admin Route Error:', err);
    res.status(500).json({ error: err.message });
  }
});
router.get('/personnel/full', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, fullname, nickname, username, role, is_active FROM personnel WHERE is_active = 1 ORDER BY fullname');
    res.json(rows);
  } catch (err) { console.error('Admin Route Error:', err); res.status(500).json({ error: err.message }); }
});

router.post('/personnel', async (req, res) => {
  const { fullname, nickname, username, password, role } = req.body;

  // Require password - no more default fallback
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'กรุณาระบุรหัสผ่านอย่างน้อย 6 ตัวอักษร' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO personnel (fullname, nickname, username, password, role) VALUES (?, ?, ?, ?, ?)',
      [fullname, nickname, username, hashedPassword, role || 'staff']
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) { console.error('Admin Route Error:', err); res.status(500).json({ error: err.message }); }
});

router.put('/personnel/:id', async (req, res) => {
  const { fullname, nickname, username, password, role } = req.body;
  try {
    let query = 'UPDATE personnel SET fullname=?, nickname=?, username=?, role=?';
    let params = [fullname, nickname, username, role];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password=?';
      params.push(hashedPassword);
    }

    query += ' WHERE id=?';
    params.push(req.params.id);

    await db.query(query, params);
    res.json({ success: true });
  } catch (err) { console.error('Admin Route Error:', err); res.status(500).json({ error: err.message }); }
});

router.delete('/personnel/:id', async (req, res) => {
  try {
    await db.query('UPDATE personnel SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { console.error('Admin Route Error:', err); res.status(500).json({ error: err.message }); }
});

// ==========================================
// 2. Departments
// ==========================================
router.get('/departments', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, 
      (SELECT COUNT(*) FROM queues q WHERE q.current_department_id = d.id AND q.status = 'WAITING' AND DATE(q.created_at) = CURDATE()) as waiting_count,
      (SELECT COUNT(*) FROM queues q WHERE q.current_department_id = d.id AND q.status = 'PROCESSING' AND DATE(q.created_at) = CURDATE()) as processing_count
      FROM departments d 
      WHERE d.is_active = 1 
      ORDER BY d.sort_order
    `);
    res.json(rows);
  } catch (err) { console.error('Admin Route Error:', err); res.status(500).json({ error: err.message }); }
});

router.post('/departments', async (req, res) => {
  const { name, code, status_message } = req.body;
  try {
    const [last] = await db.query('SELECT MAX(sort_order) as maxOrder FROM departments');
    const nextOrder = (last[0].maxOrder || 0) + 1;
    const [result] = await db.query('INSERT INTO departments (name, code, status_message, sort_order) VALUES (?, ?, ?, ?)', [name, code, status_message || null, nextOrder]);
    res.json({ success: true, id: result.insertId });
  } catch (err) { console.error('Admin Route Error:', err); res.status(500).json({ error: err.message }); }
});

router.put('/departments/:id', async (req, res) => {
  const { name, code, status_message, sort_order } = req.body;
  const id = req.params.id;
  try {
    if (sort_order !== undefined) {
      if (sort_order < 1) return res.status(400).json({ error: 'Sort order must be at least 1' });
      await handleSortOrderSwap('departments', id, sort_order);
    }
    await db.query('UPDATE departments SET name=?, code=?, status_message=?, sort_order=? WHERE id=?', [name, code, status_message || null, sort_order, id]);
    res.json({ success: true });
  } catch (err) { console.error('Admin Route Error:', err); res.status(500).json({ error: err.message }); }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    await db.query('UPDATE departments SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { console.error('Admin Route Error:', err); res.status(500).json({ error: err.message }); }
});

// ==========================================
// 3. Counters
// ==========================================
router.get('/counters', async (req, res) => {
  try {
    const { department_id } = req.query;
    let query = 'SELECT * FROM counters WHERE is_active = 1';
    const params = [];

    if (department_id) {
      query += ' AND department_id = ?';
      params.push(department_id);
    }

    query += ' ORDER BY sort_order';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Get Counters Error:', err);
    res.status(500).json({ error: 'Get Counters Error: ' + err.message });
  }
});

router.post('/counters', async (req, res) => {
  const { name, code, sort_order, department_id } = req.body;
  try {
    const [last] = await db.query('SELECT MAX(sort_order) as maxOrder FROM counters');
    const nextOrder = (last[0].maxOrder || 0) + 1;

    // Fallback for code if not provided (use name)
    const finalCode = code || name || '0';

    // Use 'number' column (varchar 10) instead of code
    const [result] = await db.query('INSERT INTO counters (name, number, sort_order, department_id) VALUES (?, ?, ?, ?)', [name, finalCode.slice(0, 10), nextOrder, department_id || null]);
    res.json({ success: true, id: result.insertId });
  } catch (err) { console.error('Create Counter Error:', err); res.status(500).json({ error: err.message }); }
});

router.put('/counters/:id', async (req, res) => {
  const { name, code, sort_order, department_id } = req.body;
  const id = req.params.id;
  try {
    if (sort_order !== undefined) {
      if (sort_order < 1) return res.status(400).json({ error: 'Sort order must be at least 1' });
      await handleSortOrderSwap('counters', id, sort_order);
    }

    const finalCode = code || name;

    await db.query('UPDATE counters SET name=?, number=?, sort_order=?, department_id=? WHERE id=?', [name, finalCode ? finalCode.slice(0, 10) : undefined, sort_order, department_id || null, id]);
    res.json({ success: true });
  } catch (err) { console.error('Update Counter Error:', err); res.status(500).json({ error: err.message }); }
});

router.delete('/counters/:id', async (req, res) => {
  try {
    await db.query('UPDATE counters SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { console.error('Delete Counter Error:', err); res.status(500).json({ error: err.message }); }
});

// ==========================================
// 4. Queue Types
// ==========================================
router.get('/queue-types', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM queue_types ORDER BY sort_order');
    res.json(rows);
  } catch (err) { console.error('Admin Route Error:', err); res.status(500).json({ error: err.message }); }
});

router.post('/queue-types', async (req, res) => {
  const { name, code, badge_color, default_department_id } = req.body;
  try {
    const [last] = await db.query('SELECT MAX(sort_order) as maxOrder FROM queue_types');
    const nextOrder = (last[0].maxOrder || 0) + 1;
    const [result] = await db.query('INSERT INTO queue_types (name, code, badge_color, default_department_id, sort_order) VALUES (?, ?, ?, ?, ?)', [name, code, badge_color, default_department_id || null, nextOrder]);
    res.json({ success: true, id: result.insertId });
  } catch (err) { console.error('Admin Route Error:', err); res.status(500).json({ error: err.message }); }
});

router.put('/queue-types/:id', async (req, res) => {
  const { name, code, badge_color, sort_order, default_department_id } = req.body;
  const id = req.params.id;
  try {
    if (sort_order !== undefined) {
      if (sort_order < 1) return res.status(400).json({ error: 'Sort order must be at least 1' });
      await handleSortOrderSwap('queue_types', id, sort_order);
    }
    await db.query('UPDATE queue_types SET name=?, code=?, badge_color=?, default_department_id=?, sort_order=? WHERE id=?', [name, code, badge_color, default_department_id || null, sort_order, id]);
    res.json({ success: true });
  } catch (err) { console.error('Admin Route Error:', err); res.status(500).json({ error: err.message }); }
});

router.delete('/queue-types/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM queue_types WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { console.error('Admin Route Error:', err); res.status(500).json({ error: err.message }); }
});

// ==========================================
// 5. Case Roles (Contact Status)
// ==========================================
router.get('/case-roles', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM case_roles ORDER BY sort_order');
    res.json(rows);
  } catch (err) { console.error('Admin Route Error:', err); res.status(500).json({ error: err.message }); }
});

router.post('/case-roles', async (req, res) => {
  const { name, badge_color } = req.body;
  try {
    const [last] = await db.query('SELECT MAX(sort_order) as maxOrder FROM case_roles');
    const nextOrder = (last[0].maxOrder || 0) + 1;
    const [result] = await db.query('INSERT INTO case_roles (name, badge_color, sort_order) VALUES (?, ?, ?)', [name, badge_color || null, nextOrder]);
    res.json({ success: true, id: result.insertId });
  } catch (err) { console.error('Admin Route Error:', err); res.status(500).json({ error: err.message }); }
});

router.put('/case-roles/:id', async (req, res) => {
  const { name, badge_color, sort_order } = req.body;
  const id = req.params.id;
  try {
    if (sort_order !== undefined) {
      if (sort_order < 1) return res.status(400).json({ error: 'Sort order must be at least 1' });
      await handleSortOrderSwap('case_roles', id, sort_order);
    }
    await db.query('UPDATE case_roles SET name=?, badge_color=?, sort_order=? WHERE id=?', [name, badge_color || null, sort_order, id]);
    res.json({ success: true });
  } catch (err) { console.error('Admin Route Error:', err); res.status(500).json({ error: err.message }); }
});

router.delete('/case-roles/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM case_roles WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { console.error('Admin Route Error:', err); res.status(500).json({ error: err.message }); }
});

// ==========================================
// 6. Display Configs
// ==========================================
router.get('/display-configs', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM display_configs ORDER BY id');
    res.json(rows);
  } catch (err) { console.error('Admin Route Error:', err); res.status(500).json({ error: err.message }); }
});

router.post('/display-configs', async (req, res) => {
  const { name, config, is_active, slug } = req.body;
  try {
    const configStr = (config && typeof config === 'object') ? JSON.stringify(config) : (config || '{}');
    const activeVal = is_active === undefined ? true : is_active;
    const [result] = await db.query('INSERT INTO display_configs (name, config, is_active, slug) VALUES (?, ?, ?, ?)', [name || 'New Display', configStr, activeVal, slug || null]);
    res.json({ success: true, id: result.insertId });
  } catch (err) { console.error('DisplayConfig Create Error:', err); console.log('Payload:', req.body); res.status(500).json({ error: err.message }); }
});

router.put('/display-configs/:id', async (req, res) => {
  const { name, config, is_active, slug } = req.body;
  try {
    const configStr = (config && typeof config === 'object') ? JSON.stringify(config) : (config || '{}');
    const activeVal = is_active === undefined ? true : is_active;
    await db.query('UPDATE display_configs SET name=?, config=?, is_active=?, slug=? WHERE id=?', [name || 'Display', configStr, activeVal, slug || null, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DisplayConfig Update Error:', err);
    console.log('Payload:', req.body);
    res.status(500).json({ error: 'Update Failed: ' + err.message, details: err.toString(), payload: req.body });
  }
});

router.delete('/display-configs/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM display_configs WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { console.error('Admin Route Error:', err); res.status(500).json({ error: err.message }); }
});


// PUT /settings (Protected - requires auth)
router.put('/settings', async (req, res) => {
  const { agency_name, announcement_text, announcement_start, announcement_end, announcement_active, overdue_alert_minutes, logo_url, footer_text } = req.body;
  try {
    const [rows] = await db.query('SELECT id FROM system_settings LIMIT 1');
    if (rows.length > 0) {
      await db.query(
        'UPDATE system_settings SET agency_name=?, announcement_text=?, announcement_start=?, announcement_end=?, announcement_active=?, overdue_alert_minutes=?, logo_url=?, footer_text=?, updated_at=NOW() WHERE id=?',
        [agency_name, announcement_text, announcement_start, announcement_end, announcement_active, overdue_alert_minutes, logo_url || null, footer_text || null, rows[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO system_settings (agency_name, announcement_text, announcement_start, announcement_end, announcement_active, overdue_alert_minutes, logo_url, footer_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [agency_name, announcement_text, announcement_start, announcement_end, announcement_active, overdue_alert_minutes, logo_url || null, footer_text || null]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Admin Route Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /kiosk-settings (Protected - admin can update)
router.put('/kiosk-settings', async (req, res) => {
  const kioskSettings = req.body;
  try {
    const [rows] = await db.query('SELECT id FROM system_settings LIMIT 1');
    const settingsJson = JSON.stringify(kioskSettings);

    if (rows.length > 0) {
      await db.query(
        'UPDATE system_settings SET kiosk_settings=?, updated_at=NOW() WHERE id=?',
        [settingsJson, rows[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO system_settings (kiosk_settings) VALUES (?)',
        [settingsJson]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Admin Route Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /logs - Fetch login logs (Admin only)
router.get('/logs', authMiddleware, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [logs] = await db.query(`
            SELECT 
                l.*,
                p.fullname as personnel_name
            FROM login_logs l
            LEFT JOIN personnel p ON l.personnel_id = p.id
            ORDER BY l.created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

    const [countResult] = await db.query('SELECT COUNT(*) as total FROM login_logs');
    const total = countResult[0].total;

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

module.exports = router;