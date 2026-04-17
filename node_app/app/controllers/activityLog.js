const ActivityLog = require('../models/ActivityLog');
const User = require('../models/user');

/**
 * GET /api/auth/get_activity_logs
 * Query params: userId, module, action, startDate, endDate, page, limit, search
 */
exports.get_activity_logs = async (req, res) => {
    try {
        const params = req.bodyParams || {};
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 50;
        const skip = (page - 1) * limit;

        const filter = {};

        if (params.userId) filter.userId = params.userId;
        if (params.module && params.module !== 'All') filter.module = params.module;
        if (params.action && params.action !== 'All') filter.action = params.action;
        if (params.status && params.status !== 'All') filter.status = params.status;

        if (params.startDate || params.endDate) {
            filter.timestamp = {};
            if (params.startDate) filter.timestamp.$gte = new Date(params.startDate);
            if (params.endDate) {
                // include the full end day
                const end = new Date(params.endDate);
                end.setHours(23, 59, 59, 999);
                filter.timestamp.$lte = end;
            }
        }

        if (params.search) {
            const searchRegex = new RegExp(params.search, 'i');
            filter.$or = [
                { userName: searchRegex },
                { userEmail: searchRegex },
                { description: searchRegex },
                { referenceName: searchRegex },
                { referenceId: searchRegex }
            ];
        }

        const [logs, total] = await Promise.all([
            ActivityLog.find(filter)
                .populate('userId', 'name email')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ActivityLog.countDocuments(filter)
        ]);

        // Enrich userName/userEmail from populated userId if blank
        const enriched = logs.map(log => {
            if (log.userId && log.userId.name) {
                log.userName = log.userName || log.userId.name;
                log.userEmail = log.userEmail || log.userId.email;
            }
            return log;
        });

        return res.apiResponse(true, 'Activity logs fetched', {
            logs: enriched,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('[get_activity_logs]', error);
        return res.apiResponse(false, 'Failed to fetch activity logs');
    }
};

/**
 * POST /api/auth/log_activity
 * Frontend-triggered log (for login, logout, page views from client side)
 */
exports.log_activity = async (req, res) => {
    try {
        const params = req.bodyParams || {};

        let userName = params.userName || '';
        let userEmail = params.userEmail || '';

        // If userId provided, enrich from DB
        if (params.userId && (!userName || !userEmail)) {
            const user = await User.findById(params.userId).select('name email').lean();
            if (user) {
                userName = userName || user.name;
                userEmail = userEmail || user.email;
            }
        }

        const log = new ActivityLog({
            userId: params.userId || null,
            userName,
            userEmail,
            module: params.module || 'Other',
            action: params.action || 'Other',
            description: params.description || '',
            referenceId: params.referenceId || '',
            referenceName: params.referenceName || '',
            ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
            status: params.status || 'Success'
        });
        await log.save();

        return res.apiResponse(true, 'Activity logged');
    } catch (error) {
        console.error('[log_activity]', error);
        return res.apiResponse(false, 'Failed to log activity');
    }
};

/**
 * GET /api/auth/get_activity_summary
 * Returns counts by module and action for a dashboard-style overview
 */
exports.get_activity_summary = async (req, res) => {
    try {
        const [byModule, byAction, recentUsers] = await Promise.all([
            ActivityLog.aggregate([
                { $group: { _id: '$module', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            ActivityLog.aggregate([
                { $group: { _id: '$action', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            ActivityLog.aggregate([
                { $sort: { timestamp: -1 } },
                { $group: { _id: '$userId', userName: { $first: '$userName' }, lastSeen: { $first: '$timestamp' }, actions: { $sum: 1 } } },
                { $sort: { lastSeen: -1 } },
                { $limit: 10 }
            ])
        ]);

        return res.apiResponse(true, 'Summary fetched', { byModule, byAction, recentUsers });
    } catch (error) {
        return res.apiResponse(false, 'Failed to fetch summary');
    }
};
