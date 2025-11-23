const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT']
    },
    resourceType: {
        type: String,
        required: true,
        enum: ['USER', 'REPORT', 'SYSTEM']
    },
    resourceId: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userEmail: String,
    ipAddress: String,
    userAgent: String,
    changes: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed
}, {
    timestamps: true
});

// Index for efficient querying
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
