// routes/licenseRoutes.js — License validation and activation API
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const crypto = require('crypto');

// ==========================================
// GET /api/license/status — Check license status (Public)
// ==========================================
router.get('/status', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT serial_key, licensed_domain, license_activated_at FROM system_settings LIMIT 1');

        if (rows.length === 0) {
            return res.json({ licensed: false, reason: 'no_settings' });
        }

        const settings = rows[0];

        // Not activated yet
        if (!settings.serial_key || !settings.licensed_domain) {
            return res.json({ licensed: false, reason: 'not_activated' });
        }

        // Check domain match
        const requestOrigin = req.headers.origin || req.headers.referer || '';
        const currentDomain = extractDomain(requestOrigin);
        const licensedDomain = settings.licensed_domain;

        // Allow localhost for development
        const isLocalhost = currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1');

        if (!isLocalhost && currentDomain && licensedDomain && !currentDomain.includes(licensedDomain)) {
            return res.json({
                licensed: false,
                reason: 'domain_mismatch',
                message: `Serial นี้ถูกผูกกับ ${licensedDomain} แล้ว`
            });
        }

        return res.json({
            licensed: true,
            domain: settings.licensed_domain,
            activated_at: settings.license_activated_at
        });
    } catch (err) {
        console.error('License Status Error:', err);
        // If columns don't exist yet, treat as not activated
        if (err.code === 'ER_BAD_FIELD_ERROR') {
            return res.json({ licensed: false, reason: 'not_setup' });
        }
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// POST /api/license/activate — Activate license with serial key
// ==========================================
router.post('/activate', async (req, res) => {
    try {
        const { serial_key } = req.body;

        if (!serial_key || serial_key.trim() === '') {
            return res.status(400).json({ error: 'กรุณากรอก Serial Number' });
        }

        // Normalize serial: uppercase, trim
        const normalizedSerial = serial_key.trim().toUpperCase();

        // Validate format: XXXX-XXXX-XXXX-XXXX
        const serialRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        if (!serialRegex.test(normalizedSerial)) {
            return res.status(400).json({ error: 'รูปแบบ Serial Number ไม่ถูกต้อง (ต้องเป็น XXXX-XXXX-XXXX-XXXX)' });
        }

        // Determine domain from request
        const requestOrigin = req.headers.origin || req.headers.referer || '';
        const currentDomain = extractDomain(requestOrigin);

        if (!currentDomain) {
            return res.status(400).json({ error: 'ไม่สามารถระบุ Domain ได้' });
        }

        // Check if serial is already used by a different domain
        const [existing] = await db.query(
            'SELECT serial_key, licensed_domain FROM system_settings WHERE serial_key = ? AND licensed_domain IS NOT NULL AND licensed_domain != ? LIMIT 1',
            [normalizedSerial, currentDomain]
        );

        if (existing.length > 0 && existing[0].licensed_domain) {
            return res.status(403).json({
                error: `Serial นี้ถูกใช้กับ ${existing[0].licensed_domain} แล้ว ไม่สามารถใช้กับ Domain อื่นได้`
            });
        }

        // Activate: save serial + domain
        const [settings] = await db.query('SELECT id FROM system_settings LIMIT 1');

        if (settings.length === 0) {
            // Create settings row if not exists
            await db.query(
                'INSERT INTO system_settings (serial_key, licensed_domain, license_activated_at) VALUES (?, ?, NOW())',
                [normalizedSerial, currentDomain]
            );
        } else {
            // Update existing row
            await db.query(
                'UPDATE system_settings SET serial_key = ?, licensed_domain = ?, license_activated_at = NOW() WHERE id = ?',
                [normalizedSerial, currentDomain, settings[0].id]
            );
        }

        return res.json({
            success: true,
            message: 'เปิดใช้งานสำเร็จ!',
            domain: currentDomain
        });
    } catch (err) {
        console.error('License Activate Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// Helper: Extract domain from URL
// ==========================================
function extractDomain(url) {
    try {
        if (!url) return '';
        // Handle URLs without protocol
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        const parsed = new URL(url);
        return parsed.hostname;
    } catch {
        return url || '';
    }
}

module.exports = router;
