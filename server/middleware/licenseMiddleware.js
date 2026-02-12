// middleware/licenseMiddleware.js — Block all API requests if license is not active
const db = require('../config/db');

// Cache license status to avoid querying DB on every request
let licenseCache = {
    licensed: null,
    domain: null,
    checkedAt: null
};

const CACHE_TTL = 60 * 1000; // Re-check every 60 seconds

/**
 * License Middleware
 * Checks if the system has a valid license before allowing API access.
 * Exempts license-related routes so activation can still happen.
 */
const licenseMiddleware = async (req, res, next) => {
    // Always allow license routes (status check & activation)
    if (req.path.startsWith('/api/license')) {
        return next();
    }

    // Always allow health check
    if (req.path === '/api/health' || req.path === '/health') {
        return next();
    }

    try {
        // Use cached result if fresh enough
        const now = Date.now();
        if (licenseCache.checkedAt && (now - licenseCache.checkedAt) < CACHE_TTL) {
            if (licenseCache.licensed) {
                return next();
            }
            return res.status(403).json({
                error: 'LICENSE_REQUIRED',
                message: 'กรุณาใส่ Serial Number เพื่อเปิดใช้งานระบบ'
            });
        }

        // Query DB for license status
        const [rows] = await db.query(
            'SELECT serial_key, licensed_domain FROM system_settings LIMIT 1'
        );

        if (rows.length === 0 || !rows[0].serial_key || !rows[0].licensed_domain) {
            licenseCache = { licensed: false, domain: null, checkedAt: now };
            return res.status(403).json({
                error: 'LICENSE_REQUIRED',
                message: 'กรุณาใส่ Serial Number เพื่อเปิดใช้งานระบบ'
            });
        }

        // License exists — check domain
        const requestOrigin = req.headers.origin || req.headers.referer || '';
        const currentDomain = extractDomain(requestOrigin);
        const licensedDomain = rows[0].licensed_domain;
        const isLocalhost = currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1');

        if (!isLocalhost && currentDomain && licensedDomain && !currentDomain.includes(licensedDomain)) {
            licenseCache = { licensed: false, domain: licensedDomain, checkedAt: now };
            return res.status(403).json({
                error: 'DOMAIN_MISMATCH',
                message: `Serial นี้ถูกผูกกับ ${licensedDomain} ไม่สามารถใช้กับ Domain นี้ได้`
            });
        }

        // All good — cache and continue
        licenseCache = { licensed: true, domain: licensedDomain, checkedAt: now };
        return next();
    } catch (err) {
        // If columns don't exist yet (first deploy), allow through
        if (err.code === 'ER_BAD_FIELD_ERROR') {
            return next();
        }
        console.error('License Middleware Error:', err);
        // On error, allow through to avoid locking out the system
        return next();
    }
};

/**
 * Reset license cache (call after activation)
 */
const resetLicenseCache = () => {
    licenseCache = { licensed: null, domain: null, checkedAt: null };
};

function extractDomain(url) {
    try {
        if (!url) return '';
        if (!url.startsWith('http')) url = 'https://' + url;
        return new URL(url).hostname;
    } catch {
        return url || '';
    }
}

module.exports = { licenseMiddleware, resetLicenseCache };
