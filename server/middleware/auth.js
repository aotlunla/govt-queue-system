// server/middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header
 */
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่' });
        }
        return res.status(401).json({ error: 'Token ไม่ถูกต้อง' });
    }
};

/**
 * Admin Role Middleware (use after authMiddleware)
 */
const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง (Admin Only)' });
    }
    next();
};

/**
 * Optional Auth Middleware (doesn't fail if no token)
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            req.user = jwt.verify(token, JWT_SECRET);
        } catch {
            // Token invalid, continue without user
        }
    }
    next();
};

module.exports = { authMiddleware, adminOnly, optionalAuth, JWT_SECRET };
