const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM personnel WHERE username = ? AND is_active = 1', [username]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'ชื่อผู้ใช้ไม่ถูกต้อง' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

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
