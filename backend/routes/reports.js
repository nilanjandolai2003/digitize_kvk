// routes/reports.js
const express = require('express');
const Report = require('../models/Report');
const AuditLog  = require('../models/AuditLog');
const { auth, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const XLSX = require('xlsx');

const router = express.Router();

// Validation middleware
const validateReport = [
    body('kvkName')
        .trim()
        .notEmpty()
        .isLength({ max: 100 })
        .withMessage('KVK name is required and must be less than 100 characters'),
    body('kvkAddress')
        .trim()
        .notEmpty()
        .withMessage('KVK address is required'),
    body('hostOrgName')
        .trim()
        .notEmpty()
        .withMessage('Host organization name is required'),
    body('headName')
        .trim()
        .notEmpty()
        .withMessage('Senior scientist name is required'),
    body('reportPreparedBy')
        .trim()
        .notEmpty()
        .withMessage('Report prepared by is required'),
    body('reportDate')
        .isISO8601()
        .withMessage('Valid report date is required')
];

// Create new report
router.post('/', auth, validateReport, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const reportData = {
            ...req.body,
            submittedBy: req.user.userId,
            status: req.body.status || 'draft'
        };

        const report = new Report(reportData);
        await report.save();

        // Log the creation
        await new AuditLog({
            action: 'CREATE',
            resourceType: 'REPORT',
            resourceId: report._id,
            userId: req.user.userId,
            userEmail: req.user.email,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: { 
                kvkName: report.kvkName,
                status: report.status
            }
        }).save();

        await report.populate('submittedBy', 'username email kvkName');

        res.status(201).json({
            success: true,
            message: 'Report created successfully',
            data: { report }
        });

    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create report',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get all reports with filtering and pagination
router.get('/', auth, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            status = '',
            dateFrom = '',
            dateTo = '',
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const skip = (page - 1) * limit;

        // Build filter query
        const filterQuery = {};

        // Role-based filtering
        if (req.user.role !== 'admin') {
            filterQuery.submittedBy = req.user.userId;
        }

        // Search filter
        if (search) {
            filterQuery.$or = [
                { kvkName: { $regex: search, $options: 'i' } },
                { hostOrgName: { $regex: search, $options: 'i' } },
                { headName: { $regex: search, $options: 'i' } },
                { reportPreparedBy: { $regex: search, $options: 'i' } }
            ];
        }

        // Status filter
        if (status) {
            filterQuery.status = status;
        }

        // Date range filter
        if (dateFrom || dateTo) {
            filterQuery.reportDate = {};
            if (dateFrom) filterQuery.reportDate.$gte = new Date(dateFrom);
            if (dateTo) filterQuery.reportDate.$lte = new Date(dateTo);
        }

        // Sort configuration
        const sortConfig = {};
        sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const [reports, total] = await Promise.all([
            Report.find(filterQuery)
                .populate('submittedBy', 'username email kvkName')
                .populate('reviewedBy', 'username email')
                .sort(sortConfig)
                .limit(parseInt(limit))
                .skip(skip),
            Report.countDocuments(filterQuery)
        ]);

        res.json({
            success: true,
            data: {
                reports,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reports'
        });
    }
});

// Get single report by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('submittedBy', 'username email kvkName')
            .populate('reviewedBy', 'username email');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Check permissions
        if (req.user.role !== 'admin' && report.submittedBy._id.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Log the view
        await new AuditLog({
            action: 'VIEW',
            resourceType: 'REPORT',
            resourceId: report._id,
            userId: req.user.userId,
            userEmail: req.user.email,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        }).save();

        res.json({
            success: true,
            data: { report }
        });

    } catch (error) {
        console.error('Get report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch report'
        });
    }
});

// Update report
router.put('/:id', auth, validateReport, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Check permissions
        if (req.user.role !== 'admin' && report.submittedBy.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Don't allow updates to approved reports unless admin
        if (report.status === 'approved' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot update approved reports'
            });
        }

        const oldData = report.toObject();
        Object.assign(report, req.body);
        await report.save();

        // Log the update
        await new AuditLog({
            action: 'UPDATE',
            resourceType: 'REPORT',
            resourceId: report._id,
            userId: req.user.userId,
            userEmail: req.user.email,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            changes: {
                from: { kvkName: oldData.kvkName, status: oldData.status },
                to: { kvkName: report.kvkName, status: report.status }
            }
        }).save();

        await report.populate('submittedBy', 'username email kvkName');

        res.json({
            success: true,
            message: 'Report updated successfully',
            data: { report }
        });

    } catch (error) {
        console.error('Update report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update report'
        });
    }
});

// Delete report
router.delete('/:id', auth, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Check permissions
        if (req.user.role !== 'admin' && report.submittedBy.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Don't allow deletion of approved reports unless admin
        if (report.status === 'approved' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete approved reports'
            });
        }

        await Report.findByIdAndDelete(req.params.id);

        // Log the deletion
        await new AuditLog({
            action: 'DELETE',
            resourceType: 'REPORT',
            resourceId: req.params.id,
            userId: req.user.userId,
            userEmail: req.user.email,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: { 
                kvkName: report.kvkName,
                deletedStatus: report.status
            }
        }).save();

        res.json({
            success: true,
            message: 'Report deleted successfully'
        });

    } catch (error) {
        console.error('Delete report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete report'
        });
    }
});

// Submit report (change status from draft to submitted)
router.post('/:id/submit', auth, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Check permissions
        if (req.user.role !== 'admin' && report.submittedBy.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (report.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Only draft reports can be submitted'
            });
        }

        report.status = 'submitted';
        await report.save();

        // Log the submission
        await new AuditLog({
            action: 'UPDATE',
            resourceType: 'REPORT',
            resourceId: report._id,
            userId: req.user.userId,
            userEmail: req.user.email,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: { action: 'report_submitted' }
        }).save();

        res.json({
            success: true,
            message: 'Report submitted successfully',
            data: { report }
        });

    } catch (error) {
        console.error('Submit report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit report'
        });
    }
});

// Review report (admin only)
router.post('/:id/review', auth, authorize('admin'), [
    body('status')
        .isIn(['reviewed', 'approved'])
        .withMessage('Status must be either reviewed or approved'),
    body('reviewComments')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Review comments must be less than 1000 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { status, reviewComments } = req.body;
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        if (report.status !== 'submitted' && report.status !== 'reviewed') {
            return res.status(400).json({
                success: false,
                message: 'Only submitted or reviewed reports can be reviewed'
            });
        }

        report.status = status;
        report.reviewComments = reviewComments;
        report.reviewedBy = req.user.userId;
        report.reviewedAt = new Date();

        await report.save();

        // Log the review
        await new AuditLog({
            action: 'UPDATE',
            resourceType: 'REPORT',
            resourceId: report._id,
            userId: req.user.userId,
            userEmail: req.user.email,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: { 
                action: 'report_reviewed',
                newStatus: status,
                hasComments: !!reviewComments
            }
        }).save();

        await report.populate(['submittedBy', 'reviewedBy'], 'username email kvkName');

        res.json({
            success: true,
            message: `Report ${status} successfully`,
            data: { report }
        });

    } catch (error) {
        console.error('Review report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to review report'
        });
    }
});

// Export reports to Excel
router.get('/export/excel', auth, async (req, res) => {
    try {
        const { 
            status = '', 
            dateFrom = '', 
            dateTo = '',
            kvkName = ''
        } = req.query;

        // Build filter query
        const filterQuery = {};
        
        // Role-based filtering
        if (req.user.role !== 'admin') {
            filterQuery.submittedBy = req.user.userId;
        }

        if (status) filterQuery.status = status;
        if (kvkName) filterQuery.kvkName = { $regex: kvkName, $options: 'i' };

        if (dateFrom || dateTo) {
            filterQuery.reportDate = {};
            if (dateFrom) filterQuery.reportDate.$gte = new Date(dateFrom);
            if (dateTo) filterQuery.reportDate.$lte = new Date(dateTo);
        }

        const reports = await Report.find(filterQuery)
            .populate('submittedBy', 'username email')
            .sort({ createdAt: -1 });

        // Transform data for Excel
        const excelData = reports.map(report => ({
            'Report ID': report._id,
            'KVK Name': report.kvkName,
            'Address': report.kvkAddress,
            'Host Organization': report.hostOrgName,
            'Senior Scientist': report.headName,
            'Status': report.status,
            'Report Date': report.reportDate ? report.reportDate.toISOString().split('T')[0] : '',
            'Submitted By': report.submittedBy?.username || '',
            'Created Date': report.createdAt.toISOString().split('T')[0],
            'OFT Target': report.technicalAchievements?.oft?.numberTarget || 0,
            'OFT Achievement': report.technicalAchievements?.oft?.numberAchievement || 0,
            'FLD Target': report.technicalAchievements?.fld?.numberTarget || 0,
            'FLD Achievement': report.technicalAchievements?.fld?.numberAchievement || 0,
            'Training Courses': report.technicalAchievements?.training?.coursesAchievement || 0,
            'Training Participants': report.technicalAchievements?.training?.participantsAchievement || 0
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        
        // Auto-size columns
        const columnWidths = Object.keys(excelData[0] || {}).map(key => ({
            wch: Math.max(key.length, 15)
        }));
        worksheet['!cols'] = columnWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', `attachment; filename=kvk_reports_${new Date().toISOString().split('T')[0]}.xlsx`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        console.error('Export reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export reports'
        });
    }
});

// Get report statistics
router.get('/stats/summary', auth, async (req, res) => {
    try {
        const filterQuery = {};
        
        // Role-based filtering
        if (req.user.role !== 'admin') {
            filterQuery.submittedBy = req.user.userId;
        }

        const [
            totalReports,
            draftReports,
            submittedReports,
            approvedReports,
            recentReports
        ] = await Promise.all([
            Report.countDocuments(filterQuery),
            Report.countDocuments({ ...filterQuery, status: 'draft' }),
            Report.countDocuments({ ...filterQuery, status: 'submitted' }),
            Report.countDocuments({ ...filterQuery, status: 'approved' }),
            Report.countDocuments({
                ...filterQuery,
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            })
        ]);

        res.json({
            success: true,
            data: {
                totalReports,
                draftReports,
                submittedReports,
                approvedReports,
                recentReports
            }
        });

    } catch (error) {
        console.error('Get report stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch report statistics'
        });
    }
});

module.exports = router;