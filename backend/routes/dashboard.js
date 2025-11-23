// routes/dashboard.js
const express = require('express');
const Report = require('../models/Report');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const dashboardRouter = express.Router();

// Get dashboard statistics
dashboardRouter.get('/stats', auth, async (req, res) => {
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
            reviewedReports,
            approvedReports,
            totalFarmersReached,
            totalTrainingPrograms,
            totalDemonstrations,
            recentActivity
        ] = await Promise.all([
            Report.countDocuments(filterQuery),
            Report.countDocuments({ ...filterQuery, status: 'draft' }),
            Report.countDocuments({ ...filterQuery, status: 'submitted' }),
            Report.countDocuments({ ...filterQuery, status: 'reviewed' }),
            Report.countDocuments({ ...filterQuery, status: 'approved' }),
            
            // Aggregate farmers reached
            Report.aggregate([
                { $match: filterQuery },
                {
                    $group: {
                        _id: null,
                        totalFarmers: {
                            $sum: {
                                $add: [
                                    '$technicalAchievements.oft.farmersTarget',
                                    '$technicalAchievements.fld.farmersTarget'
                                ]
                            }
                        }
                    }
                }
            ]),
            
            // Aggregate training programs
            Report.aggregate([
                { $match: filterQuery },
                {
                    $group: {
                        _id: null,
                        totalTraining: { $sum: '$technicalAchievements.training.coursesAchievement' }
                    }
                }
            ]),
            
            // Aggregate demonstrations
            Report.aggregate([
                { $match: filterQuery },
                {
                    $group: {
                        _id: null,
                        totalDemos: { $sum: '$technicalAchievements.fld.numberAchievement' }
                    }
                }
            ]),
            
            // Recent reports
            Report.find(filterQuery)
                .populate('submittedBy', 'username kvkName')
                .sort({ createdAt: -1 })
                .limit(5)
                .select('kvkName status createdAt submittedBy')
        ]);

        res.json({
            success: true,
            data: {
                totalReports,
                draftReports,
                submittedReports,
                reviewedReports,
                approvedReports,
                totalFarmersReached: totalFarmersReached[0]?.totalFarmers || 0,
                totalTrainingPrograms: totalTrainingPrograms[0]?.totalTraining || 0,
                totalDemonstrations: totalDemonstrations[0]?.totalDemos || 0,
                recentActivity
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics'
        });
    }
});

// Get monthly report trends
dashboardRouter.get('/trends', auth, async (req, res) => {
    try {
        const { months = 12 } = req.query;
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const filterQuery = { createdAt: { $gte: startDate } };
        
        if (req.user.role !== 'admin') {
            filterQuery.submittedBy = req.user.userId;
        }

        const trends = await Report.aggregate([
            { $match: filterQuery },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    submitted: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0]
                        }
                    },
                    approved: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.json({
            success: true,
            data: { trends }
        });

    } catch (error) {
        console.error('Dashboard trends error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trends data'
        });
    }
});

// Get system overview (admin only)
dashboardRouter.get('/system', auth, authorize('admin'), async (req, res) => {
    try {
        const [
            totalUsers,
            activeUsers,
            totalKVKs,
            systemStats
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isActive: true }),
            User.distinct('kvkName', { kvkName: { $ne: null, $ne: '' } }),
            Report.aggregate([
                {
                    $group: {
                        _id: null,
                        avgReportsPerKVK: { $avg: 1 },
                        totalFarmersImpacted: {
                            $sum: {
                                $add: [
                                    '$technicalAchievements.oft.farmersTarget',
                                    '$technicalAchievements.fld.farmersTarget'
                                ]
                            }
                        },
                        totalTrainingConducted: { $sum: '$technicalAchievements.training.coursesAchievement' }
                    }
                }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalUsers,
                activeUsers,
                totalKVKs: totalKVKs.length,
                totalFarmersImpacted: systemStats[0]?.totalFarmersImpacted || 0,
                totalTrainingConducted: systemStats[0]?.totalTrainingConducted || 0
            }
        });

    } catch (error) {
        console.error('System overview error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system overview'
        });
    }
});

module.exports = { dashboardRouter };