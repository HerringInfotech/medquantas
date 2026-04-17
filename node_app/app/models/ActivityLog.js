const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, default: '' },
    userEmail: { type: String, default: '' },
    module: { 
        type: String, 
        enum: [
            'Authentication', 'BOM', 'Cost Sheet', 'Sales Sheet',
            'Item Master', 'FG Master', 'Price Master', 'Pack Master',
            'Stage Master', 'UOM Master', 'Customer Master',
            'Conversion Factor', 'Item Group', 'Item Type', 'User Management',
            'Access Manager', 'Module List', 'Settings', 'Other'
        ],
        default: 'Other'
    },
    action: { 
        type: String, 
        enum: ['Login', 'Logout', 'Automatic Logout', 'Create', 'Update', 'Delete', 'View', 'Export', 'Email Sent', 'Password Change', 'Other'],
        default: 'Other'
    },
    description: { type: String, default: '' },
    referenceId: { type: String, default: '' },   // e.g. BOM code, Cost sheet ID
    referenceName: { type: String, default: '' }, // e.g. BOM name
    ipAddress: { type: String, default: '' },
    status: { type: String, enum: ['Success', 'Failed'], default: 'Success' }
}, { timestamps: true });

// Index for fast queries
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ module: 1 });
activityLogSchema.index({ action: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
