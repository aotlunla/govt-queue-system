const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
    const { username, password, turnstileToken } = req.body;
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const clientIp = rawIp ? rawIp.split(',')[0].trim() : null;
    const userAgent = req.headers['user-agent'];

    // 1. Verify Turnstile Token
    let TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
    let TURNSTILE_ENABLED = true; // Default to true

    try {
        const [settings] = await db.query('SELECT turnstile_secret_key, turnstile_enabled FROM system_settings LIMIT 1');
        if (settings.length > 0) {
            if (settings[0].turnstile_secret_key) TURNSTILE_SECRET_KEY = settings[0].turnstile_secret_key;
            // Handle logical 0/1 or true/false
            if (settings[0].turnstile_enabled !== undefined && settings[0].turnstile_enabled !== null) {
                TURNSTILE_ENABLED = !!settings[0].turnstile_enabled;
            }
        }
    } catch (settingsErr) {
        console.error('Failed to fetch Turnstile Secret Key from DB:', settingsErr);
    }

    // Only verify if enabled
    if (TURNSTILE_ENABLED) {
        if (!turnstileToken) {
            return res.status(400).json({ error: 'Captcha Validation Failed (Missing Token)' });
        }

        try {
            const verifyRes = await axios.post('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                secret: TURNSTILE_SECRET_KEY,
                response: turnstileToken,
                remoteip: clientIp
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (!verifyRes.data.success) {
                // Log Failed Attempt (Captcha Invalid)
                await db.query(`
                    INSERT INTO login_logs (username, action_type, ip_address, user_agent, details)
                    VALUES (?, 'LOGIN_FAILED', ?, ?, 'Captcha Invalid')
                `, [username || 'unknown', clientIp, userAgent]);

                return res.status(400).json({ error: 'Captcha Validation Failed' });
            }
        } catch (verifyErr) {
            console.error('Turnstile Verify Error:', verifyErr);
            return res.status(500).json({ error: 'Captcha Verification Error' });
        }
    }

    try {
        const [users] = await db.query('SELECT * FROM personnel WHERE username = ? AND is_active = 1', [username]);

        if (users.length === 0) {
            // Log Failed Attempt (User not found)
            await db.query(`
                INSERT INTO login_logs (username, action_type, ip_address, user_agent, details)
                VALUES (?, 'LOGIN_FAILED', ?, ?, 'User not found OR inactive')
            `, [username, clientIp, userAgent]);

            return res.status(401).json({ error: 'ชื่อผู้ใช้ไม่ถูกต้อง' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            // Log Failed Attempt (Wrong Password)
            await db.query(`
                INSERT INTO login_logs (personnel_id, username, role, action_type, ip_address, user_agent, details)
                VALUES (?, ?, ?, 'LOGIN_FAILED', ?, ?, 'Incorrect password')
            `, [user.id, user.username, user.role, clientIp, userAgent]);

            return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Log Success
        await db.query(`
            INSERT INTO login_logs (personnel_id, username, role, action_type, ip_address, user_agent, details)
            VALUES (?, ?, ?, 'LOGIN_SUCCESS', ?, ?, 'Login successful')
        `, [user.id, user.username, user.role, clientIp, userAgent]);

        // Return user info with token
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                fullname: user.fullname,
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update Profile (Name & Password) - Protected
router.put('/profile', authMiddleware, async (req, res) => {
    const { fullname, password, newPassword } = req.body;
    const userId = req.user.id; // Get ID from authenticated token

    try {
        // Verify current password first
        const [users] = await db.query('SELECT * FROM personnel WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = users[0];

        // If changing password, verify old one
        if (newPassword) {
            if (!password) {
                return res.status(400).json({ error: 'กรุณาระบุรหัสผ่านเดิม' });
            }

            // Check if user has a password set
            if (!user.password) {
                return res.status(500).json({ error: 'User has no password set. Contact admin.' });
            }

            const isMatch = await bcrypt.compare(password, user.password).catch(() => false);
            if (!isMatch) return res.status(401).json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' });

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.query('UPDATE personnel SET fullname = ?, password = ? WHERE id = ?', [fullname, hashedPassword, userId]);
        } else {
            // Just update name
            await db.query('UPDATE personnel SET fullname = ? WHERE id = ?', [fullname || '', userId]);
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Profile Update Error:', err);
        // Don't expose internal error details in production
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
    }
});

module.exports = router;
