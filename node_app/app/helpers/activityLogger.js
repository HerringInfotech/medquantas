/**
 * Activity Logger Helper
 * Usage: await logActivity(req, { module, action, description, referenceId, referenceName, status })
 */

const ActivityLog = require('../models/ActivityLog');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET || '12345Medo@';

async function logActivity(req, { module, action, description, referenceId = '', referenceName = '', status = 'Success' } = {}) {
    try {
        let userId = null, userName = '', userEmail = '';

        // Try to extract user from JWT token
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.slice(7);
                const decoded = jwt.verify(token, jwtSecret);
                // decoded.userId is the role ID — try to get the actual user from bodyParams or req.user
            } catch (_) { /* silent */ }
        }

        // Try from req.currentUser (if set by middleware) or bodyParams
        if (req.bodyParams) {
            userId = req.bodyParams.userId || req.bodyParams.userid || null;
            userName = req.bodyParams.userName || '';
        }

        const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';

        const log = new ActivityLog({
            userId,
            userName,
            userEmail,
            module,
            action,
            description,
            referenceId: referenceId ? String(referenceId) : '',
            referenceName: referenceName || '',
            ipAddress,
            status
        });
        await log.save();
    } catch (err) {
        // Never let logging errors affect the main response
        console.error('[ActivityLog Error]', err.message);
    }
}

module.exports = { logActivity };
